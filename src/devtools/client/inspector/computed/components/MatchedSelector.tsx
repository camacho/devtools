import React from "react";
import { MatchedSelectorState } from "../state";
const DeclarationValue = require("../../rules/components/DeclarationValue");

interface MatchedSelectorProps {
  selector: MatchedSelectorState;
}

export default function MatchedSelector(props: MatchedSelectorProps) {
  const { selector } = props;

  return (
    <p className={selector.overridden ? "computed-overridden" : ""}>
      <span className="rule-link">
        <a
          target="_blank"
          className="computed-link theme-link"
          title={selector.stylesheetURL}
          tabIndex={0}
        >
          {selector.stylesheet}
        </a>
      </span>
      <span dir="ltr" className="rule-text theme-fg-color3">
        <div className="fix-get-selection">{selector.selector}</div>
        <div className="fix-get-selection computed-other-property-value theme-fg-color1">
          <DeclarationValue
            colorSpanClassName="computed-color"
            colorSwatchClassName="computed-colorswatch"
            fontFamilySpanClassName="computed-font-family"
            values={selector.parsedValue}
          />
        </div>
      </span>
    </p>
  );
}
