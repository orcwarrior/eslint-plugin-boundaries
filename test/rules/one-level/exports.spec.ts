import { RuleExports, RuleExportsRule } from "../../../src/rules/exports/schema";

const { EXPORTS: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const rule = require(`../../../src/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("exports-example");

function changeRuleExportOption<T extends keyof RuleExportsRule["exports"]>(
  options: RuleExports[],
  key: T,
  value: RuleExportsRule["exports"][T]
) {
  return options.map((opt) => ({
    ...opt,
    rules: opt.rules.map((rule) => ({
      ...rule,
      exports: {
        ...rule.exports,
        [key]: value,
      },
    })),
  }));
}

const _test = (settings, options: RuleExports[]) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Basic case
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAList} from './list';",
        options,
      },
      // Using 3rd level capture of target.device
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAListMobile} from './list/mobile';",
        options,
      },
      // Testing 2nd allowed export name
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleASpecialSomething} from './view';",
        options,
      },
      // Testing Multiple exports
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleASpecialList, ModuleAViewMobile, ModuleAViewDesktop} from './view';",
        options,
      },
      // camelCase
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {moduleACreate} from './create';",
        options: changeRuleExportOption(options, "namingConvention", "camel"),
      },
      // snake_uppercase
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {MODULE_A_CREATE_SUBITEM} from './create';",
        options: changeRuleExportOption(options, "namingConvention", "snake_uppercase"),
      },
      // upper
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {MODULEACREATECANNOTREADTHIS} from './create';",
        options: changeRuleExportOption(options, "namingConvention", "upper"),
      },

      // Export * from allowed
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export * from 'modules/module-a/list';",
        options,
      },

      // Export default from allowed
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list as ModuleAList, listHelper} from 'modules/module-a/list';
        export default ModuleAList;`,
        options,
      },
      // Export with separate import and export statement
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list} from './list/mobile';
          export {list as ModuleAListMobileThingy};`,
        options,
      },
      // Export with separate import and export statement
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list} from './list/mobile';
        const localValue = 1;
        export {list as ModuleAListMobileThingy, localValue};`,
        options,
      },
      // Export local definition:
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: 'export const ModuleAValue = "foo"',
        options: changeRuleExportOption(options, "allowedTypes", ["declarations"]),
        errors: [
          "No rule allowing this dependency was found. File is of type 'modules' with moduleName 'module-b'. Dependency is of type 'modules-private' with moduleName 'module-a' and functionality 'list'",
        ],
      },
      // Export local definition - defined ealier:
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `const ModuleAValue = "foo";
        export {ModuleAValue}`,
        options: changeRuleExportOption(options, "allowedTypes", ["list", "declarations"]),
        errors: [
          "No rule allowing this dependency was found. File is of type 'modules' with moduleName 'module-b'. Dependency is of type 'modules-private' with moduleName 'module-a' and functionality 'list'",
        ],
      },
      // // TODO: Exports of mixed source:
      // {
      //   filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      //   code: `
      //   export {someComponent as otherName, someUtility, default}`,
      //   options,
      // },
    ],
    invalid: [
      // Incorrect export name: (target.functionality):
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleACreate} from './list';",
        options,
        errors: [
          "Exports of names 'ModuleACreate' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export name \"ModuleACreate\", allowed expressions: ModuleAList(**), ModuleASpecial*.",
        ],
      },
      // Incorrect export name: (target.device):
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleACreateDesktop} from './list/mobile';",
        options,
        errors: [
          "Exports of names 'ModuleACreateDesktop' from path 'test/fixtures/exports-example/modules/module-a/list/mobile/index.js' wasn't matching rule: Export name \"ModuleACreateDesktop\", allowed expressions: ModuleAList(*Mobile*), ModuleASpecial*.",
        ],
      },
      // Multiple exports with single incorrect one
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleASpecialList, ModuleAViewDesktop, ModuleAIncorrectExportName} from './view';",
        options,
        errors: [
          "Exports of names 'ModuleASpecialList, ModuleAViewDesktop, ModuleAIncorrectExportName' from path 'test/fixtures/exports-example/modules/module-a/view/index.js' wasn't matching rule: Export name \"ModuleAIncorrectExportName\", allowed expressions: ModuleAView(**), ModuleASpecial*.",
        ],
      },
      // Incorrect export name-case:
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {MODULE_A_CREATE} from './create';",
        options,
        errors: [
          "Exports of names 'MODULE_A_CREATE' from path 'test/fixtures/exports-example/modules/module-a/create/index.js' wasn't matching rule: Export name \"MODULE_A_CREATE\", allowed expressions: ModuleACreate(**), ModuleASpecial*.",
        ],
      },
      // Element-type matched but export name doesn't match "exports.namingConvention"
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAListMobileThingy as WrongName} from './list/mobile';",
        options,
        errors: [
          "Exports of names 'WrongName' from path 'test/fixtures/exports-example/modules/module-a/list/mobile/index.js' wasn't matching rule: Export name \"WrongName\", allowed expressions: ModuleAList(*Mobile*), ModuleASpecial*.",
        ],
      },
      // Exporting * where it's prohibited
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export * from 'modules/module-a/list';",
        options: changeRuleExportOption(options, "allowedTypes", ["declarations", "list"]),
        errors: [
          "Exports of names '*' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export type is \"all\", allowed types \"declarations, list\".",
        ],
      },
      // Exporting * where it's prohibited
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export * from 'modules/module-a/list';",
        options: changeRuleExportOption(options, "allowedTypes", ["declarations", "list"]),
        errors: [
          "Exports of names '*' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export type is \"all\", allowed types \"declarations, list\".",
        ],
      },
      // Export default from incorrect element-type allowed
      {
        filename: absoluteFilePath("modules/module-b/index.js"),
        code: `import {list as ModuleAList, listHelper} from 'modules/module-a/list';
        export default ModuleAList;`,
        options,
        errors: [
          "No rule allowing this dependency was found. File is of type 'modules' with moduleName 'module-b'. Dependency is of type 'modules-private' with moduleName 'module-a' and functionality 'list'",
        ],
      },
      // Export default while it's prohibited
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list as ModuleACreate, listHelper} from 'modules/module-a/create';
        export default ModuleACreate;`,
        options: changeRuleExportOption(options, "allowedTypes", ["list"]),
        errors: [
          "Exports of names 'ModuleACreate' from path 'test/fixtures/exports-example/modules/module-a/create/index.js' wasn't matching rule: Export type is \"default\", allowed types \"list\".",
        ],
      },
      // Export default using incorrect name (create "functionality" instead of list)
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list as ModuleACreate, listHelper} from 'modules/module-a/list';
        export default ModuleACreate;`,
        options: options,
        errors: [
          "Exports of names 'ModuleACreate' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export name \"ModuleACreate\", allowed expressions: ModuleAList(**), ModuleASpecial*.",
        ],
      },
      // Export declaration where it's not allowed
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `const localValue = "foo";
        export {localValue as ModuleAList};`,
        options: changeRuleExportOption(options, "allowedTypes", ["default"]),
        errors: [
          "Exports of names 'ModuleAList' from path 'undefined' wasn't matching rule: Export type is \"declarations\", allowed types \"default\". or any other of matched -1 rules.",
        ],
      },

      // // Export declaration where it's not allowed TODO: export dependencies as array'll handle that
      // {
      //   filename: absoluteFilePath("modules/module-a/index.js"),
      //   code: `import {ModuleAList} from './list';
      //   const localValue = 1;
      //   export {ModuleAList, localValue};`,
      //   options: options, //changeRuleExportOption(options, "allowedTypes", ["list", "default"]),
      //   errors: [
      //     "Exports of names 'ModuleAValue' from path 'undefined' wasn't matching rule: Export type is \"declarations\", allowed types \"list, default\". or any other of matched -1 rules.",
      //   ],
      // },
      // TODO: Export name export where prohibited
      // TODO: Naming shenenigans (re-assigning import values)
    ],
  });
};

// disallow-based options

// _test(
//   SETTINGS.oneLevel,
//
//   [
//     {
//       default: "disallow",
//       rules: [
//         {
//           from: [["modules", { elementName: "module-a" }]],
//           allow: ["@module-helpers/${from.elementName}"],
//         },
//         // {
//         //   from: [["modules", { elementName: "ModuleC" }]],
//         //   allow: [["@module-helpers/all", { specifiers: ["${from.elementName}"] }]],
//         // },
//       ],
//     },
//   ],
//   {}
// );

// testing naming convention

_test(
  SETTINGS.exportsExample,

  [
    {
      default: "disallow",
      rules: [
        {
          from: ["modules"],
          allow: [
            [
              "modules-private",
              { moduleName: "${from.moduleName}", functionality: "{create,list,view}" },
            ],
            ["utils", { file: "*" }],
          ],
          allowLocalDefinitions: true,
          // Matches "Module-A" "Create" ("Mobile*" /"*")
          exports: {
            allowNames: [
              "${from.moduleName}${target.functionality}(*${target.device}*)",
              "${from.moduleName}Special*",
            ],
            // allowNames: ["${from.domain}","${target.elementName}","*"],
            // allowNames: ["${from.domain}${from.elementName}"],
            namingConvention: "pascal",
          },
        },
        // {
        //   from: ["components"],
        //   allow: ["@module-helpers/${from.domain}"],
        //   exports: {
        //     allowNames: ["${target.elementName}*"],
        //     namingConvention: "pascal",
        //   },
        // },
        // {
        //   from: [["modules", { elementName: "ModuleC" }]],
        //   allow: [["@module-helpers/all", { specifiers: ["${from.elementName}"] }]],
        // },
      ],
    },
  ],
  {}
);
