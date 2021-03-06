const { sendMessage, addEventListener } = require("protocol/socket");
import { sessionError, uploadedData } from "@recordreplay/protocol";
import { Action } from "redux";
import { mutate } from "ui/utils/apolloClient";
import { gql } from "@apollo/client";

import { UIStore, actions, UIThunkAction } from "ui/actions";
const { ThreadFront } = require("protocol/thread");
const { prefs } = require("ui/utils/prefs");
const { getTest } = require("ui/utils/environment");

import { ExpectedError } from "ui/state/app";

export type SetUnexpectedErrorAction = Action<"set_unexpected_error"> & { error: sessionError };
export type SetExpectedErrorAction = Action<"set_expected_error"> & { error: ExpectedError };
export type SessionAction = SetExpectedErrorAction | SetUnexpectedErrorAction;

declare global {
  interface Window {
    sessionId: string;
  }
}

// Create a session to use while debugging.
export async function createSession(store: UIStore, recordingId: string) {
  addEventListener("Recording.uploadedData", onUploadedData);
  addEventListener("Recording.sessionError", onSessionError);
  try {
    ThreadFront.setTest(getTest());
    ThreadFront.recordingId = recordingId;
    const { sessionId } = await sendMessage("Recording.createSession", {
      recordingId,
    });

    window.sessionId = sessionId;
    ThreadFront.setSessionId(sessionId);
    store.dispatch(actions.setUploading(null));
    prefs.recordingId = recordingId;
  } catch (e) {
    if (e.code == 9 || e.code == 31) {
      store.dispatch(setExpectedError(e));
    } else {
      throw e;
    }
  }
}

function onUploadedData({ uploaded, length }: uploadedData): UIThunkAction {
  return ({ dispatch }) => {
    const uploadedMB = (uploaded / (1024 * 1024)).toFixed(2);
    const lengthMB = length ? (length / (1024 * 1024)).toFixed(2) : undefined;
    dispatch(actions.setUploading({ total: lengthMB, amount: uploadedMB }));
  };
}

function onSessionError(error: sessionError): UIThunkAction {
  return ({ dispatch }) => {
    setSessionError(error);
    dispatch(setUnexpectedError(error));
  };
}

export function setExpectedError(error: ExpectedError): SetExpectedErrorAction {
  return { type: "set_expected_error", error };
}

export function setUnexpectedError(error: sessionError): SetUnexpectedErrorAction {
  return { type: "set_unexpected_error", error };
}

function setSessionError({ sessionId, code }: { sessionId: string; code: number }) {
  return mutate({
    mutation: gql`
      mutation AddSessionError($sessionId: String, $error: String) {
        update_sessions(where: { id: { _eq: $sessionId } }, _set: { error: $error }) {
          returning {
            id
            error
          }
        }
      }
    `,
    variables: { sessionId, error: `${code}` },
  });
}
