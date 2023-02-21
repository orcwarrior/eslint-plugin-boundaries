import { Rule } from "eslint";
import { validateRules, validateSettings } from "../helpers/validations";
import { meta, RuleMeta } from "../helpers/rules";
import { BoundariesConfigSettings, RuleBoundariesBaseConfig } from "../configs/EslintPluginConfig";
import { FileInfo, fileInfo } from "../core/elementsInfo";
import { DependencyInfo, dependencyInfo } from "../core/dependencyInfo";

// TODO: Further action on this, causes types mismatch (ts-lint vs. eslint)
// const createRule: Rule.RuleModule = ESLintUtils.RuleCreator(
//   () => `https://github.com/javierbrea/eslint-plugin-boundaries`
// );
type RuleOptions = {
  validate?: boolean;
  validateRules?: { mainKey?: string; onlyMainKey?: boolean };
};
type BoundariesRuleContext = Rule.RuleContext & {
  settings: BoundariesConfigSettings;
};
// TODO: Finalize types
type RuleFunctionParam<TRuleConfig> = {
  /** Imported/Exported dependency that's currently checked*/
  dependency: DependencyInfo;
  file: FileInfo;
  node: Rule.Node;
  context: BoundariesRuleContext;
  /** Rule options array w/o severity level (first element)*/
  options: TRuleConfig; // | [];
};
type RuleFunction<TRuleConfig> = (param: RuleFunctionParam<TRuleConfig>) => any;
const dependencyRule = <TRuleConfig = RuleBoundariesBaseConfig>(
  ruleMeta: RuleMeta,
  rule: RuleFunction<TRuleConfig>,
  ruleOptions: RuleOptions = {}
) => ({
  create: (context: BoundariesRuleContext): Rule.RuleListener => {
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

        rule({ file, dependency, options, node, context });
      },
    };
  },
  meta: meta(ruleMeta),
  name: ruleMeta.ruleName,
  defaultOptions: undefined,
});
export { dependencyRule };
export type { RuleOptions, BoundariesRuleContext };
