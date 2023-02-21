import {dependencyRule} from "../rules-factories/dependency-rule";
import {RULE_NO_UNKNOWN} from "../constants/settings";
import {dependencyLocation} from "../helpers/rules";

export default dependencyRule(
  {
    ruleName: RULE_NO_UNKNOWN,
    description: `Prevent importing unknown elements from the known ones`,
    schema: null
  },
  function ({dependency, node, context}) {
    if (!dependency.isIgnored && dependency.isLocal && !dependency.type) {
      context.report({
        message: `Importing unknown elements is not allowed`,
        node: node,
        ...dependencyLocation(node, context)
      });
    }
  },
  {validate: false}
);
