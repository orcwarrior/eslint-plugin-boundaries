import { dependencyRule } from "../rules-factories/dependency-rule";
import { RULE_NO_PRIVATE } from "../constants/settings";
import { dependencyLocation } from "../helpers/rules";
import { customErrorMessage, elementMessage } from "../helpers/messages";

function errorMessage(file, dependency, options) {
  if (options.message) {
    return customErrorMessage(options.message, file, dependency);
  }
  return `Dependency is private of element ${elementMessage(dependency.parents[0])}`;
}

export default dependencyRule<{ allowUncles?: boolean; message?: string }>(
  {
    ruleName: RULE_NO_PRIVATE,
    description: "Prevent importing private elements of another element",
    schema: [
      {
        type: "object",
        properties: {
          allowUncles: { type: "boolean" },
          message: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  function ({ file, dependency, node, context, options }) {
    if (
      !dependency.isIgnored &&
      dependency.isLocal &&
      dependency.type &&
      dependency.parents.length &&
      dependency.relationship !== "internal" &&
      dependency.relationship !== "child" &&
      dependency.relationship !== "brother" &&
      (!options || !options.allowUncles || dependency.relationship !== "uncle")
    ) {
      context.report({
        message: errorMessage(file, dependency, options),
        node: node,
        ...dependencyLocation(node, context),
      });
    }
  },
  { validate: false }
);
