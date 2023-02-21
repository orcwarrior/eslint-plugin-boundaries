import {dependencyRule} from "../rules-factories/dependency-rule";
import {dependencyLocation} from "../helpers/rules";
import {RULE_NO_IGNORED} from "../constants/settings";


export default dependencyRule(
  {
    ruleName: RULE_NO_IGNORED,
    description: `Prevent importing ignored files from recognized elements`,
    schema: null
  },
  function({dependency, node, context}) {
    if (dependency.isIgnored) {
      context.report({
        message: `Importing ignored files is not allowed`,
        node: node,
        ...dependencyLocation(node, context)
      });
    }
  },
  {validate: false}
);
