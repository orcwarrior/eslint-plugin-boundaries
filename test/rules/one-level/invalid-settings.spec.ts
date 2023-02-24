const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { customErrorMessage, elementTypesNoRuleMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("one-level");

const _test = (settings, options, errorMessages) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    // Everything is valid, as settings are wrong
    // valid: [
    //   // Helpers can't import another if everything is disallowed
    //   {
    //     filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
    //     code: "import HelperB from 'helpers/helper-b'",
    //     options: [
    //       {
    //         default: "disallow",
    //       },
    //     ],
    //   },
    //   // Helpers can't import another helper
    //   {
    //     filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
    //     code: "import HelperB from 'helpers/helper-b'",
    //     options,
    //   },
    //   // Helpers can't import a component:
    //   {
    //     filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
    //     code: "import ComponentA from 'components/component-a'",
    //     options,
    //   },
    //   // Helpers can't import a module:
    //   {
    //     filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
    //     code: "import ModuleA from 'modules/module-a'",
    //     options,
    //   },
    //   // Components can't import a module:
    //   {
    //     filename: absoluteFilePath("components/component-a/ComponentA.js"),
    //     code: "import ModuleA from 'modules/module-a'",
    //     options,
    //   },
    // ],
    valid: [],
    invalid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        settings: SETTINGS.oneLevel,
        options: [
          {
            default: "disallow",
          },
        ],
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "'helpers' with elementName 'helper-b'",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

// no element settings

_test(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [],
  },
  [
    {
      default: "disallow",
    },
  ],
  {}
);

// no type

_test(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        pattern: "foo/*",
        capture: ["elementName"],
      },
    ],
  },
  [],
  {}
);

// no valid mode

_test(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        mode: "foo",
      },
    ],
  },
  [],
  {}
);

// no valid capture

_test(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        pattern: "foo/*",
        capture: "foo",
      },
    ],
  },
  [],
  {}
);
