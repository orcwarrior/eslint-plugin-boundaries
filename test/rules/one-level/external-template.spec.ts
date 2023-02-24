const { EXTERNAL: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { customErrorMessage, externalNoRuleMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("one-level");

const _test = (settings, options, errorMessages) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Module-a can import @module-helpers/module-a
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { Icon } from '@module-helpers/module-a'",
        options,
      },
      // ModuleC can import moduleC from @module-helpers/all
      {
        filename: absoluteFilePath("modules/ModuleC/ModuleC.js"),
        code: "import { ModuleC } from '@module-helpers/all'",
        options,
      },
    ],
    invalid: [
      // Module-a can`t import @module-helpers/module-b
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleBHelpers from '@module-helpers/module-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@module-helpers/module-b",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // ModuleC can`t import specifier different to ModuleC from @module-helpers/all
      {
        filename: absoluteFilePath("modules/ModuleC/ModuleC.js"),
        code: "import { Foo } from '@module-helpers/all'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'modules' with elementName 'ModuleC'",
                dep: "@module-helpers/all",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

// disallow-based options

_test(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: [["modules", { elementName: "module-a" }]],
          allow: ["@module-helpers/${from.elementName}"],
        },
        {
          from: [["modules", { elementName: "ModuleC" }]],
          allow: [["@module-helpers/all", { specifiers: ["${from.elementName}"] }]],
        },
      ],
    },
  ],
  {}
);
