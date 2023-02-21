import { Rules, RuleName } from "./constants/rules";
import { rules } from "./constants/rules";
import { recommended } from "./configs/recommended";
import { strict } from "./configs/strict";

const importRules = (ruleNames: Rules): Record<RuleName, any> => {
  return Object.keys(ruleNames).reduce((loadedRules, ruleKey) => {
    loadedRules[rules[ruleKey]] = require(`./rules/${rules[ruleKey]}`).default;
    return loadedRules;
  }, {} as Record<RuleName, any>);
};

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// export all rules in lib/rules
// export all configs

export default {
  rules: importRules(rules),
  configs: {
    recommended,
    strict,
  },
};
