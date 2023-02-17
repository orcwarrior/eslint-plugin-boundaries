import micromatch from "micromatch";
import {ImportSpecifier} from "estree";
import {
  dependencyLocation,
  elementRulesAllowDependency,
  IsMatchFn,
  micromatchPatternReplacingObjectsValues
} from "../helpers/rules";
import {DependencyInfo} from "../core/dependencyInfo";
import {rulesOptionsSchema} from "../helpers/validations";
import {customErrorMessage, elementMessage, ruleElementMessage} from "../helpers/messages";
import {dependencyRule} from "../rules-factories/dependency-rule";
import {RULE_EXTERNAL} from "../constants/settings";
import {ElementInfo} from "../core/elementsInfo";
import {RuleBoundariesBaseConfig} from "../configs/EslintPluginConfig";


function specifiersMatch(specifiers: ImportSpecifier[], options, elementsCapturedValues) {

  const importedSpecifiersNames = specifiers
    .filter((specifier) => {
      return specifier.type === "ImportSpecifier" && specifier.imported.name;
    })
    .map((specifier) => specifier.imported.name);

  return options.reduce((found, option) => {
    const matcherWithTemplateReplaced = micromatchPatternReplacingObjectsValues(
      option,
      elementsCapturedValues
    );
    if (micromatch.some(importedSpecifiersNames, matcherWithTemplateReplaced)) {
      found.push(option);
    }
    return found;
  }, []);
}

type DependencyWithSpecifiers = DependencyInfo & { specifiers: ImportSpecifier[] }
const isMatchExternalDependency: IsMatchFn = (
  dependency: DependencyWithSpecifiers,
  matcher, options, elementsCapturedValues) => {

  const matcherWithTemplatesReplaced = micromatchPatternReplacingObjectsValues(
    matcher,
    elementsCapturedValues);
  const isMatch = micromatch.isMatch(dependency.baseModule, matcherWithTemplatesReplaced);

  if (isMatch && options && Object.keys(options).length) {
    const specifiersResult = specifiersMatch(
      dependency.specifiers,
      options.specifiers,
      elementsCapturedValues
    );
    return {
      result: specifiersResult.length > 0,
      report: specifiersResult
    };
  }
  return {result: isMatch};
};

function elementRulesAllowExternalDependency(element: ElementInfo,
  dependency: DependencyWithSpecifiers,
  options: RuleBoundariesBaseConfig) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchExternalDependency
  });
}


function errorMessage(ruleData, file, dependency) {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message,
      file, dependency,
      {specifiers: ruleData.report && ruleData.report.join(", ")});
  }
  if (ruleReport.isDefault) {
    return `No rule allows the usage of external module '${
      dependency.baseModule
    }' in elements ${elementMessage(file)}`;
  }

  const fileReport = `is not allowed in ${ruleElementMessage(
    ruleReport.element,
    file.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;

  if (ruleData.report) {
    return `Usage of '${ruleData.report.join(", ")}' from external module '${
      dependency.baseModule
    }' ${fileReport}`;
  }
  return `Usage of external module '${dependency.baseModule}' ${fileReport}`;
}

export default dependencyRule(
  {
    ruleName: RULE_EXTERNAL,
    description: `Check allowed external dependencies by element type`,
    schema: rulesOptionsSchema({
      targetMatcherOptions: {
        type: "object",
        properties: {
          specifiers: {
            type: "array",
            items: {type: "string"}
          }
        },
        additionalProperties: false
      }
    })
  },
  function({dependency, file, node, context, options}) {
    if (dependency.isExternal) {
      const ruleData = elementRulesAllowExternalDependency(
        file,
        // TODO: Improve typing in dependencyRule
        {...dependency, specifiers: (node as any).source.parent.specifiers},
        options
      );
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node: node,
          ...dependencyLocation(node, context)
        });
      }
    }
  },
  {validateRules: {onlyMainKey: true}}
);
