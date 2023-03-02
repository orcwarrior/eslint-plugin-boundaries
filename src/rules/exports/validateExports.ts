import { RuleExportsRule } from "./schema";
import { ExportedModuleInfo } from "./exportedDependency";
import { CapturedValues, ElementInfo } from "../../core/elementsInfo";
import micromatch from "micromatch";
import { replaceObjectValuesInTemplates } from "../../helpers/utils";
import { buildExportNamesUtils } from "./namesUtils";

type SingleValidationResult = { valid: boolean; errorDetails?: string };

function exportTypeValidation(
  exportType: ExportedModuleInfo["exportType"],
  ruleAllowedTypes: RuleExportsRule["exports"]["allowedTypes"]
): SingleValidationResult {
  const valid = !ruleAllowedTypes || ruleAllowedTypes.includes(exportType);
  const errorDetails = valid
    ? undefined
    : `Export type is "${exportType}", allowed types "${ruleAllowedTypes.join(", ")}".`;
  return { valid, errorDetails };
}

function exportNameAllowed(
  { allowNames, namingConvention, nameWordSeparator }: RuleExportsRule["exports"],
  exportName: string,
  captures: CapturedValues
): SingleValidationResult {
  const nameUtils = buildExportNamesUtils(nameWordSeparator);
  // TODO: works with pascal, fails with anything else
  // keep separator and do replacement at the end instead
  const matcherWithTemplatesReplaced = replaceObjectValuesInTemplates(
    allowNames,
    captures,
    (s) => " " + s, // Extra separator so .toConvention can work as supposed
    true
  ).map((str) => nameUtils.toConvention(str.trim(), namingConvention));

  console.log({ matcherWithTemplatesReplaced });

  const valid = micromatch.any(exportName, matcherWithTemplatesReplaced);
  const errorDetails = valid
    ? undefined
    : `Export name "${exportName}", allowed expressions: ` +
      `${matcherWithTemplatesReplaced.join(", ")}.`;
  return { valid, errorDetails };
}

type ValidateExportDetails = {
  type: SingleValidationResult;
  name: SingleValidationResult;
};
type ValidateExportsResult = {
  valid: boolean;
  details: ValidateExportDetails;
  rule?: RuleExportsRule;
};

function singleRuleValidate(
  srcElement: ElementInfo,
  exportInfo: ExportedModuleInfo,
  rule: RuleExportsRule
): Omit<ValidateExportsResult, "rule"> {
  const captures = {
    from: srcElement.capturedValues,
    target: exportInfo.capturedValues,
  };
  const shouldValidateName =
    exportInfo.exportsName &&
    (exportInfo.exportType === "list" || exportInfo.exportType === "declarations");
  const type = exportTypeValidation(exportInfo.exportType, rule.exports.allowedTypes);
  const name: SingleValidationResult = shouldValidateName
    ? exportNameAllowed(rule.exports, exportInfo.exportsName, captures)
    : { valid: true };

  const valid = type.valid && name.valid;
  return { valid, details: { type, name } };
}

/** Checks if for given element exportInfo matches given rules (which is already prematched by from/target & allow/disallow*/
function validateExports(
  srcElement: ElementInfo,
  exportInfo: ExportedModuleInfo,
  matchedRules: RuleExportsRule[]
): ValidateExportsResult {
  let closestFailedRule = { valid: true, details: undefined, mark: -1, rule: null };

  for (const rule of matchedRules) {
    const { valid, details } = singleRuleValidate(srcElement, exportInfo, rule);
    if (valid) {
      return { valid, details };
    } else {
      const mark = Object.values(details).reduce((sum, { valid }) => sum + Number(valid), 0);
      closestFailedRule =
        mark > closestFailedRule.mark ? { valid, mark, details, rule } : closestFailedRule;
    }
  }
  // Nothing has matched, return false and value that validated properly most of: type; name; nameConvention
  const { mark, ...failedResult } = closestFailedRule;
  return failedResult;
}

export type { ValidateExportsResult };
export { validateExports };
