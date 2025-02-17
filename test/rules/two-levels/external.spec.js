const { EXTERNAL: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { customErrorMessage, externalNoRuleMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const test = (settings, options, { absoluteFilePath }, errorMessages) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Helpers can import foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/main.js"),
        code: "import FooLibrary from 'foo-library'",
        options,
      },
      // atom-b can import material-ui
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
      },
      // molecule-b can import material-ui
      {
        filename: absoluteFilePath("components/molecules/molecule-b/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
      },
      // layout-b can import material-ui
      {
        filename: absoluteFilePath("components/layouts/layout-b/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
      },
      // atom-b can import material-ui/foo
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import { Label } from '@material-ui/foo'",
        options,
      },
      // molecule-b can import material-ui/foo
      {
        filename: absoluteFilePath("components/molecules/molecule-b/index.js"),
        code: "import { Label } from '@material-ui/foo'",
        options,
      },
      // layout-b can import material-ui/foo
      {
        filename: absoluteFilePath("components/layouts/layout-b/index.js"),
        code: "import { Label } from '@material-ui/foo'",
        options,
      },
      // domain-a modules can import react-router-dom
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
      // domain-b modules can import react-router-dom
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
      // domain-a modules can import react
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import React from 'react'",
        options,
      },
      // pages can import react
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import React from 'react'",
        options,
      },
      // External dependencies can be imported
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import 'chalk'",
      },
    ],
    invalid: [
      // Helpers can't import react
      {
        filename: absoluteFilePath("helpers/helper-a/main.js"),
        code: "import React from 'react'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "react",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // atom-a can't import material-ui
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'components' with category 'atoms' and elementName 'atom-a'",
                dep: "@material-ui/core",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // molecule-a can't import material-ui
      {
        filename: absoluteFilePath("components/molecules/molecule-a/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              2,
              externalNoRuleMessage({
                file: "'components' with category 'molecules' and elementName 'molecule-a'",
                dep: "@material-ui/core",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // layout-a can't import material-ui
      {
        filename: absoluteFilePath("components/layouts/layout-a/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              3,
              externalNoRuleMessage({
                file: "'components' with category 'layouts' and elementName 'layout-a'",
                dep: "@material-ui/core",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // pages can't import react-router-dom
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import { Link } from 'react-router-dom'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              externalNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "react-router-dom",
              })
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain-b modules can't import react
      {
        filename: absoluteFilePath("modules/domain-b/module-b/index.js"),
        code: "import 'react'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              externalNoRuleMessage({
                file: "'modules' with domain 'domain-b' and elementName 'module-b'",
                dep: "react",
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

test(
  SETTINGS.twoLevels,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "helpers",
          allow: ["foo-library"],
        },
        {
          from: [["components", { elementName: "*-b" }]],
          allow: ["@material-ui/*"],
        },
        {
          from: [["modules", { domain: "!pages" }]],
          allow: ["react-router-dom"],
        },
        {
          from: [["modules", { domain: "*-a" }]],
          allow: ["react"],
        },
        {
          from: [["modules", { domain: "pages" }]],
          allow: ["react"],
        },
      ],
    },
  ],
  pathResolvers("two-levels"),
  {}
);

test(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "helpers",
          allow: ["foo-library"],
        },
        {
          from: [["components", { elementName: "*-b" }]],
          allow: ["@material-ui/*"],
        },
        {
          from: [["modules", { domain: "!pages" }]],
          allow: ["react-router-dom"],
        },
        {
          from: [["modules", { domain: "*-a" }]],
          allow: ["react"],
        },
        {
          from: [["modules", { domain: "pages" }]],
          allow: ["react"],
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  {}
);
