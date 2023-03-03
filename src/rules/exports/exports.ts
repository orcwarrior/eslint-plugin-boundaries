import {
  dependencyLocation,
  elementRulesAllowDependency,
  getMatchingRules,
  isMatchElementType,
  meta,
} from "../../helpers/rules";
import { dependencyInfo } from "../../core/dependencyInfo";
import { customErrorMessage } from "../../helpers/messages";
import { BoundariesRuleContext, RuleEntryPointFn } from "../../rules-factories/dependency-rule";
import { RULE_EXPORTS } from "../../constants/settings";
import { FileInfo, fileInfo } from "../../core/elementsInfo";
import { RuleExports, RuleExportsRule } from "./schema";
import { validateRules, validateSettings } from "../../helpers/validations";
import { Rule } from "eslint";
import { storeImportDeclaration } from "./importsStore";
import { ExportedModuleInfo, exportedModuleInfo } from "./exportedDependency";
import { validateExports, ValidateExportsResult } from "./validateExports";
import { exportsPluginSchema } from "./schema";
import { elementTypesErrorMessage } from "../element-types";
import { RuleBoundariesBaseConfig } from "../../configs/EslintPluginConfig";

function errorMessage(
  { rule, details: { type, name } }: ValidateExportsResult,
  file: FileInfo,
  exportInfo: ExportedModuleInfo,
  rulesCount: number
) {
  const { exports } = rule;
  if (rule.message) {
    return customErrorMessage(rule.message, file, exportInfo, {
      details: { name, type },
      exports,
      exportName: exportInfo.exportName,
      exportType: exportInfo.exportType,
    });
  }

  const unmatchedRules = [
    `${type.valid ? "" : type.errorDetails}`,
    `${name.valid ? "" : name.errorDetails}`,
  ]
    .filter(Boolean)
    .join("\n\t");

  const exportsName =
    exportInfo.nodeType === "ExportAllDeclaration" ? "*" : exportInfo.exportName || "(no name)";

  const otherMatchedRulesStr = rulesCount > 0 ? ` or any other of matched ${rulesCount} rules.` : "";
  return (
    `Export of name '${exportsName}' from path '${exportInfo.path}' wasn't matching rule: ${unmatchedRules}` +
    otherMatchedRulesStr
  );
}

function testElementTypeOrLocalValidity(context, dependency): boolean {
  const options: RuleExports = context.options[0];
  const file = fileInfo(context);

  if (dependency.isLocalDefinition) {
    // If export is an local definition:
    return options.rules.some((rule) => rule.allowLocalDefinitions);
  } else {
    // Preform regular rule.from; allow / disallow matching
    const ruleData = elementRulesAllowDependency({
      element: file,
      dependency,
      options: options as any,
      isMatch: isMatchElementType,
    });

    if (!ruleData.result) {
      context.report({
        message: elementTypesErrorMessage(ruleData as any, file, dependency),
        node: dependency.node,
        ...dependencyLocation(dependency.node, context),
      });
    }
    return ruleData.result;
  }
}

const testDependencyExportValidity: RuleEntryPointFn<RuleExports, ExportedModuleInfo> = ({
  dependency,
  file,
  node,
  context,
  options,
}) => {
  const isMatchedElementTypeOrLocal = testElementTypeOrLocalValidity(context, dependency);

  if (isMatchedElementTypeOrLocal) {
    {
      // Additional validation of exports field of the rule
      const elementTypesMatchedRules = getMatchingRules<RuleExportsRule>({
        element: file,
        dependency,
        options: options as RuleBoundariesBaseConfig,
        isMatch: (element, pattern, captures, elementsToCompareCapturedValues) => {
          return isMatchElementType(element, pattern, captures, elementsToCompareCapturedValues);
        },
      });
      const matchedElementTypeIdxs = elementTypesMatchedRules.map(({ index }) => index);
      const unmatchedRules = options.rules.filter((_, idx) => !matchedElementTypeIdxs.includes(idx));

      const localMatchedRules = dependency.isLocalDefinition
        ? unmatchedRules.filter(({ allowLocalDefinitions }) => allowLocalDefinitions)
        : [];
      const matchedRules = [...elementTypesMatchedRules, ...localMatchedRules];

      const exportValidation = validateExports(file, dependency, matchedRules);
      if (!exportValidation.valid) {
        context.report({
          message: errorMessage(exportValidation, file, dependency, matchedRules.length - 1),
          node,
          // Conditional as not all the exports are based on dependency
          ...(dependency.source ? dependencyLocation(node, context) : {}),
        });
      }
    }
  }
};

const ruleOptions = { validateRules: { onlyMainKey: false } };
const exportsRule = {
  create: (context: BoundariesRuleContext): Rule.RuleListener => {
    const options = context.options[0];
    validateSettings(context.settings);
    validateRules(context.settings, options.rules, ruleOptions.validateRules);

    const file = fileInfo(context);

    return {
      /**
       * @example: export * from '@module-helpers/module-a */
      ExportAllDeclaration: (node) => {
        const dependencies = exportedModuleInfo(node, context, file);

        dependencies.map((dependency) =>
          testDependencyExportValidity({ file, dependency, options, node: dependency.node, context })
        );
      },
      /** Exports multiple values as in export { a, b as c }. If source !== null, re-exports from that module as in export { ... } from "source". */
      ExportNamedDeclaration: (node) => {
        const dependencies = exportedModuleInfo(node, context, file);

        dependencies.map((dependency) =>
          testDependencyExportValidity({ file, dependency, options, node: dependency.node, context })
        );
      },
      ExportDefaultDeclaration: (node) => {
        const dependencies = exportedModuleInfo(node, context, file);

        dependencies.map((dependency) =>
          testDependencyExportValidity({ file, dependency, options, node: dependency.node, context })
        );
      },
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);
        storeImportDeclaration(file, dependency, node);
      },
    };
  },
  meta: meta({
    ruleName: RULE_EXPORTS,
    description: "Check allowed export paths element type",
    schema: exportsPluginSchema,
  }),
  name: RULE_EXPORTS,
  defaultOptions: undefined,
} as Rule.RuleModule;
export default exportsRule;
