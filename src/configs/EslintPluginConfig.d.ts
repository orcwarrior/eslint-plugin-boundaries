import {EslintPluginName} from "../constants/plugin";
import {ELEMENTS, IGNORE} from "../constants/settings";
import {FullRuleName} from "../constants/rules";


type EslintRuleLevel = "error" | "strict" | "warn" | false | 0 | 1 | 2;
// Partially typed for better DX
type EslintRuleConfig = EslintRuleLevel | [EslintRuleLevel, ...any];

type EslintPluginConfig = {
  plugins: [EslintPluginName];
  rules: Record<FullRuleName, EslintRuleConfig>;
  settings: {
    [ELEMENTS]: any[],
    [IGNORE]: string[],
  },
}

export type {EslintPluginConfig};
