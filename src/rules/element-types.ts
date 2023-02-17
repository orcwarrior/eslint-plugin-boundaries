import {RULE_ELEMENT_TYPES} from "../constants/settings";
import {dependencyRule} from "../rules-factories/dependency-rule";
import {rulesOptionsSchema} from "../helpers/validations";
import {
  dependencyLocation,
  elementRulesAllowDependency,
  isMatchElementType
} from "../helpers/rules";
import {customErrorMessage, elementMessage, ruleElementMessage} from "../helpers/messages";
import { RuleErrorReporterFunction, RuleMatchingFunction } from "./types";


const elementRulesAllowDependencyType: RuleMatchingFunction = (element, dependency, options) => {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchElementType
  });
};

const errorMessage: RuleErrorReporterFunction = (ruleData, file, dependency) => {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allowing this dependency was found. File is ${elementMessage(
      file
    )}. Dependency is ${elementMessage(dependency)}`;
  }
  return `Importing ${ruleElementMessage(
    ruleReport.disallow,
    file.capturedValues
  )} is not allowed in ${ruleElementMessage(
    ruleReport.element,
    file.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;
}

export default dependencyRule(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema()
  },
  function({dependency, file, node, context, options}) {
    if (dependency.isLocal && !dependency.isIgnored && dependency.type && !dependency.isInternal) {
      const ruleData = elementRulesAllowDependencyType(file, dependency, options);
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node,
          ...dependencyLocation(node, context)
        });
      }
    }
  }
);
