import micromatch from "micromatch";
import {JSONSchema4} from "json-schema";
import {BoundariesConfigSettings, EslintPluginConfig} from "../configs/EslintPluginConfig";
import {RuleOptions} from "../rules-factories/dependency-rule";

const {TYPES, ALIAS, ELEMENTS, VALID_MODES} = require("../constants/settings");

const {getElementsTypeNames, isLegacyType} = require("./settings");
const {rulesMainKey} = require("./rules");
const {warnOnce} = require("./debug");
const {isArray, isString} = require("./utils");

const invalidMatchers = [];

const DEFAULT_MATCHER_OPTIONS: JSONSchema4 = {type: "object"};

function elementsMatcherSchema(matcherOptions = DEFAULT_MATCHER_OPTIONS): JSONSchema4 {
  return {
    oneOf: [
      {type: "string" // single matcher
      },
      {
        type: "array", // multiple matchers
        items: {
          oneOf: [
            {type: "string" // matcher with options
            },
            {
              type: "array",
              items: [
                {type: "string" // matcher
                },
                matcherOptions // options
              ]
            }
          ]
        }
      }
    ]
  };
}

type RulesOptionsSchemaParam = {
  rulesMainKey?: boolean,
  targetMatcherOptions?: JSONSchema4
}

function rulesOptionsSchema(options: RulesOptionsSchemaParam = {}) {
  const mainKey = rulesMainKey(options.rulesMainKey);
  return [
    {
      type: "object",
      properties: {
        message: {type: "string"},
        default: {
          type: "string",
          enum: ["allow", "disallow"]
        },
        rules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              [mainKey]: elementsMatcherSchema(),
              allow: elementsMatcherSchema(options.targetMatcherOptions),
              disallow: elementsMatcherSchema(options.targetMatcherOptions),
              message: {type: "string"}
            },
            additionalProperties: false,
            anyOf: [
              {required: [mainKey, "allow", "disallow"]},
              {required: [mainKey, "allow"]},
              {required: [mainKey, "disallow"]}
            ]
          }
        }
      },
      additionalProperties: false
    }
  ];
}

function isValidElementTypesMatcher(matcher, settings) {
  const [matcherToCheck] = isArray(matcher) ? matcher : [matcher];
  return !matcher || micromatch.some(getElementsTypeNames(settings), matcherToCheck);
}

function validateElementTypesMatcher(elementsMatcher, settings) {
  const [matcher] = isArray(elementsMatcher) ? elementsMatcher : [elementsMatcher];
  if (!invalidMatchers.includes(matcher) && !isValidElementTypesMatcher(matcher, settings)) {
    invalidMatchers.push(matcher);
    warnOnce(`Option '${matcher}' does not match any element type from '${ELEMENTS}' setting`);
  }
}


function validateElements(elements: BoundariesConfigSettings["boundaries/elements"]): void {
  if (!elements || !isArray(elements) || !elements.length) {
    warnOnce(`Please provide element types using the '${ELEMENTS}' setting`);
    return;
  }
  elements.forEach((element) => {
    // TODO, remove in next major version
    if (isLegacyType(element)) {
      warnOnce(
        `Defining elements as strings in settings is deprecated. Will be automatically converted, but this feature will be removed in next major versions`
      );
    } else {
      Object.keys(element).forEach(() => {
        if (!element.type || !isString(element.type)) {
          warnOnce(`Please provide type in '${ELEMENTS}' setting`);
        }
        if (element.mode && !VALID_MODES.includes(element.mode)) {
          warnOnce(
            `Invalid mode property in '${ELEMENTS}' setting. Should be one of ${VALID_MODES.join(
              ","
            )}. Default value "${VALID_MODES[0]}" will be used instead`
          );
        }
        if (!element.pattern || !(isString(element.pattern) || isArray(element.pattern))) {
          warnOnce(`Please provide a valid pattern in '${ELEMENTS}' setting`);
        }
        if (element.capture && !isArray(element.capture)) {
          warnOnce(`Invalid capture property in '${ELEMENTS}' setting`);
        }
      });
    }
  });
}

function deprecateAlias(aliases) {
  if (aliases) {
    warnOnce(
      `Defining aliases in '${ALIAS}' setting is deprecated. Please use 'import/resolver' setting`
    );
  }
}

function deprecateTypes(types) {
  if (types) {
    warnOnce(`'${TYPES}' setting is deprecated. Please use '${ELEMENTS}' instead`);
  }
}

function validateSettings(settings: EslintPluginConfig["settings"]) {
  deprecateTypes(settings[TYPES]);
  deprecateAlias(settings[ALIAS]);
  validateElements(settings[ELEMENTS] || settings[TYPES]);
}

function validateRules(settings: BoundariesConfigSettings, rules = [], options: RuleOptions["validateRules"] = {}) {
  const mainKey = rulesMainKey(options.mainKey);
  rules.forEach((rule) => {
    validateElementTypesMatcher([rule[mainKey]], settings);
    if (!options.onlyMainKey) {
      validateElementTypesMatcher(rule.allow, settings);
      validateElementTypesMatcher(rule.disallow, settings);
    }
  });
}

export {
  elementsMatcherSchema,
  rulesOptionsSchema,
  validateElementTypesMatcher,
  validateSettings,
  validateRules
};
