import type {EslintPluginName} from "./plugin";

const rules = {
  ELEMENT_TYPES: "element-types",
  ENTRY_POINT: "entry-point",
  EXTERNAL: "external",
  NO_IGNORED: "no-ignored",
  NO_PRIVATE: "no-private",
  NO_UNKNOWN_FILES: "no-unknown-files",
  NO_UNKNOWN: "no-unknown"
} as const;

type RuleKey = keyof typeof rules & string;
type RuleName = typeof rules[RuleKey];
type Rules = {
  [key in RuleKey]: typeof rules[key];
};
/** Full name to be used in plugin config, for example: "boundaries/entry-point" */
type FullRuleName<Rule extends RuleName = RuleName> = `${EslintPluginName}/${Rule}`;

export {rules};
export const ELEMENT_TYPES = rules.ELEMENT_TYPES;
export const ENTRY_POINT = rules.ENTRY_POINT;
export const EXTERNAL = rules.EXTERNAL;
export const NO_IGNORED = rules.NO_IGNORED;
export const NO_PRIVATE = rules.NO_PRIVATE;
export const NO_UNKNOWN_FILES = rules.NO_UNKNOWN_FILES;
export const NO_UNKNOWN = rules.NO_UNKNOWN;
export const RULE_MAIN_KEY = "from";

export type {Rules, RuleName, FullRuleName};
