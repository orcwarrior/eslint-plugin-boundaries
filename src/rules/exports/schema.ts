import { JSONSchema4 } from "json-schema";
import { elementsMatcherSchema } from "../../helpers/validations";
import { ElementTypeConfig, RuleAllowance } from "../../configs/EslintPluginConfig";

const exportsPluginSchema: JSONSchema4 = {
  type: "array",
  items: {
    type: "object",
    properties: {
      default: {
        type: "string",
        enum: ["allow", "disallow"],
      },
      message: { type: "string" },
      rules: {
        type: "array",
        items: {
          type: "object",
          properties: {
            from: elementsMatcherSchema(),
            allow: elementsMatcherSchema(),
            disallow: elementsMatcherSchema(),
            allowLocalDefinitions: { type: "boolean", default: true },
            message: { type: "string" },
            exports: {
              type: "object",
              properties: {
                allowNames: {
                  oneOf: [
                    { type: "string" }, // Basic string pattern?
                    {
                      type: "array",
                      items: { type: "string" }, // TODO: Ensure this is required? (for concating multipe captures for example)
                    },
                  ],
                },
                allowedTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["declarations", "list", "default", "all"],
                  },
                },
                namingConvention: {
                  type: "string",
                  enum: ["pascal", "camel", "snake_uppercase", "upper"],
                },
              },
              anyOf: [
                { required: ["allowNames"] },
                { required: ["allowedTypes"] },
                { required: ["namingConvention"] },
              ],
            },
          },
        },
        additionalProperties: false,
        anyOf: [
          { required: ["allow", "disallow"] },
          { required: ["allow"] },
          { required: ["disallow"] },
        ],
      },
    },
  },
  additionalProperties: false,
};

type RuleExports = {
  default?: RuleAllowance;
  message?: string;
  rules: Array<RuleExportsRule>;
};
type RuleExportsRule = {
  from: ElementTypeConfig[];
  // ...disallow importing this type of elements
  disallow?: ElementTypeConfig[];
  allow?: ElementTypeConfig[];
  /** Determines if local exports matches this specific rule
   * example of local definition: `export const foo = "bar";`*/
  allowLocalDefinitions: boolean;
  message?: string;
  exports?: {
    /** Allowed export-name patterns can rely on captures (of imported path) and the*/
    allowNames: string[];
    /** Regex of characters to be used as word separators*/
    nameWordSeparator?: string;
    /** Naming convention of exported modules*/
    namingConvention: "pascal" | "camel" | "snake_uppercase" | "upper";
    /**
     * @tutorial https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#syntax
     * TODO: "all" (stars exports has some serious limitations - no allowedNames checks possible
     * */
    allowedTypes?: Array<"declarations" | "list" | "default" | "all">;
  };
};

export { exportsPluginSchema };
export type { RuleExports, RuleExportsRule };
