import {Linter} from "eslint";
import {EslintPluginName} from "../constants/plugin";
import {
  ELEMENTS,
  IGNORE,
  INCLUDE, RULE_ELEMENT_TYPES, RULE_ENTRY_POINT, RULE_EXTERNAL,
  RULE_NO_IGNORED,
  RULE_NO_PRIVATE, RULE_NO_UNKNOWN,
  RULE_NO_UNKNOWN_FILES
} from "../constants/settings";


type ElementCaptureMatcher = Record<string, string>
/** Type just to note type defined by an user as one of boundaries/elements*/
type ElementType = string;
type ElementTypeConfig = ElementType | [ElementType, ElementCaptureMatcher];
type RuleAllowance = "allow" | "disallow";

type RuleBoundariesBaseConfig = {
  // Allow or disallow any dependency by default
  default: RuleAllowance,
  /** Define a custom message for this rule, format: "${file.type} is not allowed to import ${dependency.type}" */
  message: string,
  rules: Array<RuleBoundariesRule>
}
type RuleBoundariesRule = {
  // In this type of files...
  from: ElementTypeConfig[],
  target: ElementTypeConfig[]
  // ...disallow importing this type of elements
  disallow: ElementTypeConfig[],
  allow: ElementTypeConfig[],
  // ...and return this custom error message
  "message": "Helpers must not import other thing than helpers"
};
type LinterRuleConfig = Linter.RuleLevel | [Linter.RuleLevel];
type EslintBoundariesRuleConfig<T = RuleBoundariesBaseConfig> = LinterRuleConfig
| [Linter.RuleLevel, ...T[]];

type BoundariesConfigRules = {
  /** Check allowed dependencies between element types
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/element-types.md */
  [RULE_ELEMENT_TYPES]: EslintBoundariesRuleConfig;

  /** Check entry point used for each element type
   * @description
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/entry-point.md */
  [RULE_ENTRY_POINT]: EslintBoundariesRuleConfig;

  /** Check allowed external dependencies by element type
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/external.md */
  [RULE_EXTERNAL]: EslintBoundariesRuleConfig;

  /** Prevent importing private elements of another element
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/no-private.md */
  [RULE_NO_PRIVATE]: EslintBoundariesRuleConfig<{ allowUncles?: boolean, message?: string }>;
  /** Prevent importing ignored files from recognized elements
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/no-ignored.md */
  [RULE_NO_IGNORED]: LinterRuleConfig;
  /** Prevent creating files not recognized as any of the element types
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/no-unknown-files.md */
  [RULE_NO_UNKNOWN_FILES]: LinterRuleConfig;
  /** Prevent importing unknown elements from the known ones
   * @link https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/no-unknown.md */
  [RULE_NO_UNKNOWN]: LinterRuleConfig;
}

type BoundariesElement = {
  /** Element type to be assigned to files or imports matching the pattern. This type will be used afterwards in the rules configuration.*/
  type: string;
  /** micromatch pattern. By default, the plugin will try to match this pattern progressively starting from the right side of each file path.n*/
  pattern: string | string[];
  /** Optional micromatch pattern. If provided, the left side of the element path must match also with this pattern from the root of the project (like if pattern is [basePattern]/**‍/[pattern]). */
  basePattern?: string;

  /** - When it is set to **folder** (default value), the element type will be assigned to the first file's parent folder matching the pattern. In the practice, it is like adding **‍//* to the given pattern, but the plugin makes it by itself because it needs to know exactly which parent folder has to be considered the element.
   *
   * - If it is set to **file**, the given pattern will not be modified, but the plugin will still try to match the last part of the path. So, a pattern like *.model.js would match with paths src/foo.model.js
   *
   * - If it is set to **full**, the given pattern will only match with patterns matching the full path. This means that you will have to provide patterns matching from the base project path. So, in order to match src/modules/foo/foo.model.js you'll have to provide patterns like **‍/*.model.js, **‍/*‍/*.model.js, src/*‍/*‍/*.model.js, etc. (the chosen pattern will depend on what do you want to capture from the path)
   */
  mode?: "folder" | "file" | "full"

  /** This is a very powerful feature of the plugin. It allows to capture values of some fragments in the matching path to use them later in the rules configuration. It uses micromatch capture feature under the hood, and stores each value in an object with the given capture key being in the same index of the captured array.
   @example: given pattern: "helpers/*‍/\*.js", capture: ["category", "elementName"], and a path helpers/data/parsers.js, it will result in { category: "data", elementName: "parsers" }.*/
  capture?: string[];
  /**  Optional. micromatch pattern. It allows capturing values from basePattern as capture does with pattern. All keys from capture and baseCapture can be used in the rules configuration.*/
  baseCapture?: string[]
};
type BoundariesConfigSettings = {
  [ELEMENTS]: BoundariesElement[],
  /** Files or dependencies not matching these micromatch patterns will be ignored by the plugin. If this option is not provided, all files will be included.*/
  [IGNORE]: string[],
  /** Files or dependencies matching these micromatch patterns will be ignored by the plugin.*/
  [INCLUDE]: string[],
}
type EslintPluginConfig = {
  plugins: [EslintPluginName];
  rules: BoundariesConfigRules;
  settings: BoundariesConfigSettings;
}

export type {
  ElementType,
  ElementCaptureMatcher,
  ElementTypeConfig,

  EslintPluginConfig,
  BoundariesElement,
  BoundariesConfigSettings,
  RuleBoundariesBaseConfig,
  RuleBoundariesRule,
  BoundariesConfigRules
};
