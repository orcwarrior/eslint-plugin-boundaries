import { FullRuleName, RULE_MAIN_KEY, RuleName } from "../constants/rules";
import { Rule } from "eslint";
import micromatch from "micromatch";
import { replaceObjectValuesInTemplates } from "./utils";
import { CapturedValues, ElementInfo } from "../core/elementsInfo";
import { DependencyInfo } from "../core/dependencyInfo";
import {
  ElementCaptureMatcher,
  ElementType,
  ElementTypeConfig,
  RuleBoundariesBaseConfig,
  RuleBoundariesRule,
} from "../configs/EslintPluginConfig";

const REPO_URL = "https://github.com/javierbrea/eslint-plugin-boundaries";
type MicromatchPattern = string | string[];

function removePluginNamespace(ruleName: FullRuleName): RuleName {
  return ruleName.replace("boundaries/", "") as RuleName;
}

function docsUrl(ruleName: FullRuleName): string {
  return `${REPO_URL}/blob/master/docs/rules/${removePluginNamespace(ruleName)}.md`;
}

type RuleMeta = {
  ruleName: FullRuleName;
  description: string;
  schema: any;
};

function meta({ description, schema = [], ruleName }: RuleMeta): Rule.RuleMetaData {
  return {
    type: "problem",
    docs: {
      url: docsUrl(ruleName),
      description,
      category: "dependencies",
    },
    fixable: null,
    schema,
  };
}

function dependencyLocation(node, context) {
  const columnStart = context.getSourceCode().getText(node).indexOf(node.source.value) - 1;
  const columnEnd = columnStart + node.source.value.length + 2;
  return {
    loc: {
      start: {
        line: node.loc.start.line,
        column: columnStart,
      },
      end: {
        line: node.loc.end.line,
        column: columnEnd,
      },
    },
  };
}

function isObjectMatch(
  captures: ElementCaptureMatcher,
  object: CapturedValues,
  objectsWithValuesToReplace: ElementsToCompareCapturedValues
): boolean {
  return Object.keys(captures).reduce((isMatch, key) => {
    if (isMatch) {
      const micromatchPattern = replaceObjectValuesInTemplates(
        captures[key],
        objectsWithValuesToReplace
      );
      return micromatch.isMatch(object[key] as string, micromatchPattern);
    }
    return isMatch;
  }, true);
}

type RuleMatchResult = {
  result: boolean;
  /** TODO: couldn't find any case of that value usage*/
  report?: any | null;
};
type ElementsToCompareCapturedValues = CapturedValues & {
  from: CapturedValues;
  target: CapturedValues;
};
type IsMatchFn = (
  targetElement: ElementInfo,
  element: ElementType,
  captureValues: ElementCaptureMatcher,
  elementsCapturedValues: ElementsToCompareCapturedValues
) => RuleMatchResult;

/** Match targetElement (mostly dependencies) with fromElement (file currently validated by a plugin)
 * using rule matchers (rule.allow or rule.disallow) by using
 * isMatch function called with target captures and current context (capture values)*/
function ruleMatch(
  ruleMatchers: ElementTypeConfig | ElementTypeConfig[],
  targetElement: ElementInfo,
  isMatch: IsMatchFn,
  fromElement: ElementInfo
): RuleMatchResult {
  let match: RuleMatchResult = {
    result: false,
    report: null,
  };

  const matchers = wrapRulesInArray(ruleMatchers);
  matchers.forEach((matcher) => {
    if (!match.result) {
      const [value, captures = {}] = Array.isArray(matcher) ? matcher : [matcher];
      match = isMatch(targetElement, value, captures, {
        from: fromElement.capturedValues,
        target: targetElement.capturedValues,
      });
    }
  });
  return match;
}

/** Ensures configured rules are wrapped in an array, also in case of rules like:
 *  ["components", { "family": "${from.family}" }] so they'll be wrapped in additional array*/
function wrapRulesInArray(rules: ElementTypeConfig | ElementTypeConfig[]): ElementTypeConfig[] {
  if (!Array.isArray(rules)) {
    return [rules];
  } else if (Array.isArray(rules) && !Array.isArray(rules[1]) && typeof rules[1] == "object") {
    return [rules as [ElementType, ElementCaptureMatcher]];
  } else {
    return rules as ElementTypeConfig[];
  }
}

function isMatchElementKey(
  elementInfo: ElementInfo,
  pattern: MicromatchPattern,
  captures: ElementCaptureMatcher,
  elementKey: string,
  elementsToCompareCapturedValues: ElementsToCompareCapturedValues
): { result: boolean } {
  if (!elementInfo[elementKey]) {
    return { result: false };
  }
  const isMatch = micromatch.isMatch(
    elementInfo[elementKey],
    replaceObjectValuesInTemplates(pattern, elementsToCompareCapturedValues)
  );
  if (isMatch && captures) {
    return {
      result: isObjectMatch(captures, elementInfo.capturedValues, elementsToCompareCapturedValues),
    };
  }
  return { result: isMatch };
}

const isMatchElementType = buildMatcherFn("type");
/** Builds "regular" elementInfo matcher based on passed key */
function buildMatcherFn(elementKey: keyof ElementInfo): IsMatchFn {
  return (elementInfo, pattern, captures, elementsToCompareCapturedValues) =>
    isMatchElementKey(elementInfo, pattern, captures, elementKey, elementsToCompareCapturedValues);
}

/** Picks matching rules according to specific ElementType*/
function getElementRules(
  elementInfo: ElementInfo,
  options: RuleBoundariesBaseConfig,
  mainKey = RULE_MAIN_KEY
): Array<RuleBoundariesRule & { index: number }> {
  if (!options.rules) {
    return [];
  }
  return options.rules
    .map((rule, index) => ({ ...rule, index }))
    .filter((rule) => {
      return ruleMatch(rule[mainKey], elementInfo, isMatchElementType, elementInfo).result;
    });
}

/** checks if rule main key is "from" (RULE_MAIN_KEY)*/
function isFromRule(mainKey): boolean {
  return mainKey === RULE_MAIN_KEY;
}

/**  Depending on the mainKey it picks:
 * element: if (mainKey == "from" ) // RULE_MAIN_KEY
 * dependency: otherwise
 ]*/
function elementToGetRulesFrom(element: ElementInfo, dependency: DependencyInfo, mainKey: string) {
  return isFromRule(mainKey) ? element : dependency;
}

type ElementRulesAllowDependencyParam = {
  element: ElementInfo;
  dependency: DependencyInfo;
  options: RuleBoundariesBaseConfig;
  /** Matcher function that properly
   * matches found element against the rule */
  isMatch: IsMatchFn;
  /** Key which is used to pick elements that rule will apply to
   * @default "from" */
  rulesMainKey?: string;
};
type ElementRulesAllowDependencyResult = {
  /** was compliant with rules set?*/
  result: boolean;
  /** rule report ???*/
  report?: any;
  ruleReport?: {
    message: string;
    isDefault?: boolean;
    // TODO: Ensure 2 types below are correct
    element?: ElementTypeConfig[];
    disallow?: ElementTypeConfig[];
    index?: number;
  };
};

function elementRulesAllowDependency({
  element,
  dependency,
  options,
  isMatch,
  rulesMainKey = RULE_MAIN_KEY,
}: ElementRulesAllowDependencyParam): ElementRulesAllowDependencyResult {
  const [result, report, ruleReport] = getElementRules(
    elementToGetRulesFrom(element, dependency, rulesMainKey),
    options,
    rulesMainKey
  ).reduce(
    (allowed, rule) => {
      if (rule.disallow) {
        const match = ruleMatch(rule.disallow, dependency, isMatch, element);
        if (match.result) {
          return [
            false,
            match.report,
            {
              element: rule[rulesMainKey],
              disallow: rule.disallow,
              index: rule.index,
              message: rule.message || options.message,
            },
          ];
        }
      }
      if (rule.allow) {
        const match = ruleMatch(rule.allow, dependency, isMatch, element);
        if (match.result) {
          return [true, match.report];
        }
      }
      return allowed;
    },
    [
      options.default === "allow",
      null,
      {
        isDefault: true,
        message: options.message,
      },
    ]
  );

  return { result, report, ruleReport };
}

/** Returns rules of options that matches particular element definition
 * and the dependency */
function getMatchingRules<T extends RuleBoundariesRule>({
  element,
  dependency,
  options,
  isMatch,
  rulesMainKey = RULE_MAIN_KEY,
}: ElementRulesAllowDependencyParam): Array<T & { index: number }> {
  return getElementRules(
    elementToGetRulesFrom(element, dependency, rulesMainKey),
    options,
    rulesMainKey
  ).filter((rule) => {
    const match = ruleMatch(rule.allow ?? rule.disallow, dependency, isMatch, element);
    return rule.allow ? match.result : match.result === false;
  }) as Array<T & { index: number }>;
}

export {
  meta,
  dependencyLocation,
  isObjectMatch,
  buildMatcherFn,
  isMatchElementKey,
  isMatchElementType,
  ruleMatch,
  elementRulesAllowDependency,
  getMatchingRules,
  getElementRules,
};
export type {
  MicromatchPattern,
  IsMatchFn,
  RuleMeta,
  ElementsToCompareCapturedValues,
  ElementRulesAllowDependencyResult,
};
