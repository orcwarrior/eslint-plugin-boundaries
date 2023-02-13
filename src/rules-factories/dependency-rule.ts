import {ESLintUtils} from "@typescript-eslint/utils";
import {validateRules, validateSettings} from "../helpers/validations";
import {RuleMeta} from "../helpers/rules";
import {BoundariesConfigSettings} from "../configs/EslintPluginConfig";
import {RuleContext} from "@typescript-eslint/utils/dist/ts-eslint/Rule";

const {fileInfo} = require("../core/elementsInfo");
const {dependencyInfo} = require("../core/dependencyInfo");


const {meta} = require("../helpers/rules");

const createRule = ESLintUtils.RuleCreator(
  // TODO: Link to docs?
  name => `https://example.com/rule/${name}`
);
type RuleOptions = {
  validate?: boolean;
  validateRules?: { mainKey?: string, onlyMainKey?: boolean };
}
type BoundariesRuleContext = RuleContext<string, any> & {
  settings: BoundariesConfigSettings;
}
const dependencyRule = (ruleMeta: RuleMeta, rule, ruleOptions: RuleOptions = {}) => createRule({
  create: (context: BoundariesRuleContext) => {
    const options = context.options[0];
    validateSettings(context.settings);
    const file = fileInfo(context);
    if ((ruleOptions.validate !== false && !options) || file.isIgnored || !file.type) {
      return {};
    }
    if (ruleOptions.validate !== false) {
      validateRules(context.settings, options.rules, ruleOptions.validateRules);
    }

    return {
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);

        rule({file, dependency, options, node, context});
      }
    };
  },
  meta: meta(ruleMeta),
  name: ruleMeta.ruleName,
  defaultOptions: undefined
});
export {dependencyRule};
export type {RuleOptions};
