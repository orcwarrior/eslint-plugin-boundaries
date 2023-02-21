import {RULE_NO_UNKNOWN_FILES} from "../constants/settings";
import {meta} from "../helpers/rules";
import {fileInfo} from "../core/elementsInfo";

export default {
  ...meta({
    ruleName: RULE_NO_UNKNOWN_FILES,
    description: `Prevent creating files not recognized as any of the element types`,
    schema: null
  }),
  create: function (context) {
    const file = fileInfo(context);
    if (file.type || file.isIgnored) {
      return {};
    }

    return {
      Program: (node) => {
        context.report({
          message: `File is not of any known element type`,
          node: node
        });
      }
    };
  }
};
