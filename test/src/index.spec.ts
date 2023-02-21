import pluginPackage from "../../src";

const {rules} = require("../../src/constants/rules");

describe("package", () => {
  describe("rules property", () => {
    it("should contain all rules defined in constants", () => {
      Object.keys(rules).forEach((ruleKey) => {
        console.log("rule: ", ruleKey, pluginPackage.rules[rules[ruleKey]]);
        expect(pluginPackage.rules[rules[ruleKey]].create).toBeDefined();
      });
    });
  });
});
