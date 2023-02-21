import { RULE_ENTRY_POINT } from "../constants/settings";
import { dependencyRule } from "../rules-factories/dependency-rule";
import { rulesOptionsSchema } from "../helpers/validations";
import { dependencyLocation, elementRulesAllowDependency, isMatchElementKey } from "../helpers/rules";
import { customErrorMessage, elementMessage, ruleElementMessage } from "../helpers/messages";
import { RuleErrorReporterFunction, RuleMatchingFunction } from "./types";

const elementRulesAllowEntryPoint: RuleMatchingFunction = (element, dependency, options) => {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: (elementInfo, matcher, options, elementsCapturedValues) =>
      isMatchElementKey(elementInfo, matcher, options, "internalPath", elementsCapturedValues),
    rulesMainKey: "target",
  });
};

const errorMessage: RuleErrorReporterFunction = (ruleData, file, dependency) => {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allows the entry point '${
      dependency.internalPath
    }' in dependencies ${elementMessage(dependency)}`;
  }
  return `The entry point '${dependency.internalPath}' is not allowed in ${ruleElementMessage(
    ruleReport.element as string[],
    dependency.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;
};

export default dependencyRule(
  {
    ruleName: RULE_ENTRY_POINT,
    description: "Check entry point used for each element type",
    schema: rulesOptionsSchema({ rulesMainKey: "target" }),
  },
  function ({ dependency, file, node, context, options }) {
    if (!dependency.isIgnored && dependency.type && !dependency.isInternal) {
      const ruleData = elementRulesAllowEntryPoint(file, dependency, options);
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node: node,
          ...dependencyLocation(node, context),
        });
      }
    }
  },
  { validateRules: { onlyMainKey: true, mainKey: "target" } }
);
