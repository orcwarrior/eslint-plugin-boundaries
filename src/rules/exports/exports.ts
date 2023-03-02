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
import { storeImport } from "./importsStore";
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
    });
  }

  const unmatchedRules = [
    `${type.valid ? "" : type.errorDetails}`,
    `${name.valid ? "" : name.errorDetails}`,
  ]
    .filter(Boolean)
    .join("\n\t");

  const exportsNames =
    exportInfo.nodeType === "ExportAllDeclaration"
      ? "*"
      : exportInfo.exportsNames.join(", ") || "(no names)";

  const otherMatchedRulesStr = rulesCount ? ` or any other of matched ${rulesCount} rules.` : "";
  return (
    `Exports of names '${exportsNames}' from path '${exportInfo.path}' wasn't matching rule: ${unmatchedRules}` +
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

const ruleEntryPoint: RuleEntryPointFn<RuleExports, ExportedModuleInfo> = ({
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
      console.log("validate: ", file, dependency);
      const elementTypesMatchedRules: RuleExportsRule[] = getMatchingRules<RuleExportsRule>({
        element: file,
        dependency,
        options: options as RuleBoundariesBaseConfig,
        isMatch: (element, pattern, captures, elementsToCompareCapturedValues) => {
          return isMatchElementType(element, pattern, captures, elementsToCompareCapturedValues);
        },
      });
      const localMatchedRules = dependency.isLocalDefinition
        ? options.rules.filter(({ allowLocalDefinitions }) => allowLocalDefinitions)
        : [];
      const matchedRules = [...elementTypesMatchedRules, ...localMatchedRules];

      const exportValidation = validateExports(file, dependency, matchedRules);
      if (!exportValidation.valid) {
        context.report({
          message: errorMessage(
            exportValidation,
            file,
            dependency,
            elementTypesMatchedRules.length - 1
          ),
          node,
          // Conditional as not all of the exports are based on dependency
          ...(dependency.source ? dependencyLocation(node, context) : {}),
        });
      }
    }
  }
};

const ruleOptions = { validateRules: { onlyMainKey: false } };
export default {
  create: (context: BoundariesRuleContext): Rule.RuleListener => {
    const options = context.options[0];
    validateSettings(context.settings);
    validateRules(context.settings, options.rules, ruleOptions.validateRules);

    const file = fileInfo(context);

    return {
      /**
       * @example: export * from '@module-helpers/module-a */
      ExportAllDeclaration: (node) => {
        const dependency = exportedModuleInfo(node, context, file);
        console.log("ExportAllDeclaration: ", { node, dependency });

        ruleEntryPoint({ file, dependency, options, node, context });
      },
      /** Exports multiple values as in export { a, b as c }. If source !== null, re-exports from that module as in export { ... } from "source". */
      ExportNamedDeclaration: (node) => {
        // TODO:
        const dependency = exportedModuleInfo(node, context, file);
        ruleEntryPoint({ file, dependency, options, node: dependency.node, context });
      },
      ExportDefaultDeclaration: (node) => {
        const dependency = exportedModuleInfo(node, context, file);

        // TODO: dependency.node everywhere!
        ruleEntryPoint({ file, dependency, options, node: dependency.node, context });
      },
      ExportSpecifier: (node) => {
        if (node.parent.type.startsWith("Export")) {
          return;
        }

        const dependency = exportedModuleInfo(node, context, file);
        // console.log("ExportSpecifier: ", { node });

        // TODO: Re-enable when it it properly restores values from imports cache
        ruleEntryPoint({ file, dependency, options, node: dependency.node, context });
      },
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);
        // const localImportName = node.specifiers["0"].local?.name; // TODO: it should preform map
        // console.log(`ImportDeclaration: store[${localImportName}]=${dependency.path}`);
        storeImport(file, dependency, node);
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
