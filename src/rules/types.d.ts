import { ElementInfo, FileInfo } from "../core/elementsInfo";
import { DependencyInfo } from "../core/dependencyInfo";
import { RuleBoundariesBaseConfig } from "../configs/EslintPluginConfig";
import { ElementRulesAllowDependencyResult } from "../helpers/rules";

type RuleMatchingFunction = (
  element: ElementInfo,
  dependency: DependencyInfo,
  options: RuleBoundariesBaseConfig
) => ElementRulesAllowDependencyResult;

type RuleErrorReporterFunction = (
  ruleData: ElementRulesAllowDependencyResult,
  file: FileInfo,
  dependency: DependencyInfo
) => string;

export { RuleMatchingFunction, RuleErrorReporterFunction };
