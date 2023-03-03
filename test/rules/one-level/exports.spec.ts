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

const _test = (settings, options: RuleExports[], tests) => {
  const ruleTester = createRuleTester(settings);
  const _tests = tests(options);
  ruleTester.run(RULE, rule, _tests);
};

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
      ],
    },
  ],
  (options) => ({
    valid: [
      {
        name: "Basic case for allowed export names",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAList} from './list';",
        options,
      },
      {
        name: "Using 3rd level capture of target.device",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAListMobile} from './list/mobile';",
        options,
      },
      {
        name: "2nd allowed export name rule",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAView, ModuleASpecialSomething} from './view';",
        options,
      },

      // Multiple exports
      {
        name: "Multiple exports",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleASpecialList, ModuleAViewMobile, ModuleAViewDesktop} from './view';",
        options,
      },
      {
        name: "Multiple exports from different sources",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {ModuleAViewMobile} from "./view/mobile";
        import {ModuleACreateForm} from "./create";
        const localVar = "foo";
        export {ModuleAViewMobile, ModuleACreateForm, localVar as ModuleALocalVar};`,
        options,
      },

      // Export name-cases
      {
        name: "namingConvention: camel",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {moduleACreate} from './create';",
        options: changeRuleExportOption(options, "namingConvention", "camel"),
      },
      {
        name: "namingConvention: snake_uppercase",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {MODULE_A_CREATE_SUBITEM} from './create';",
        options: changeRuleExportOption(options, "namingConvention", "snake_uppercase"),
      },
      {
        name: "namingConvention: upper",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {MODULEACREATECANNOTREADTHIS} from './create';",
        options: changeRuleExportOption(options, "namingConvention", "upper"),
      },

      // Export types
      {
        name: "Export * (all) type",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export * from 'modules/module-a/list';",
        options,
      },
      {
        name: "Export default type",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list as AnyNameYouWant, listHelper} from 'modules/module-a/list';
        export default AnyNameYouWant; // Name doesn't matter - it's still a default.`,
        options,
      },

      {
        name: "Export default from file",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {default} from 'modules/module-a/list';",
        options,
      },
      // Advanced cases
      {
        name: "Export-name aliasing",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list} from './list/mobile';
          export {list as ModuleAListMobileThingy};`,
        options,
      },
      {
        name: "Export with separate import and export statement",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list} from './list/mobile';
        const localValue = 1;
        export {list as ModuleAListMobileThingy, localValue as ModuleALocalValue};`,
        options,
      },
      {
        name: "Mixing list and default exports together",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {create as ModuleACreate, someName} from 'modules/module-a/create';
        export {ModuleACreate, someName as default};`,
        options: options,
      },
    ],
    invalid: [
      // Export allowed names tests
      {
        name: "Incorrect export name: (target.functionality)",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleACreate} from './list';",
        options,
        errors: [
          "Export of name 'ModuleACreate' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export name \"ModuleACreate\", allowed expressions: ModuleAList(**), ModuleASpecial*.",
        ],
      },
      {
        name: "Incorrect export name: (target.device)",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleACreateDesktop} from './list/mobile';",
        options,
        errors: [
          "Export of name 'ModuleACreateDesktop' from path 'test/fixtures/exports-example/modules/module-a/list/mobile/index.js' wasn't matching rule: Export name \"ModuleACreateDesktop\", allowed expressions: ModuleAList(*Mobile*), ModuleASpecial*.",
        ],
      },
      // Multiple exports
      {
        name: "Multiple exports with single incorrect one",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleASpecialList, ModuleAViewDesktop, ModuleAIncorrectExportName} from './view';",
        options,
        errors: [
          "Export of name 'ModuleAIncorrectExportName' from path 'test/fixtures/exports-example/modules/module-a/view/index.js' wasn't matching rule: Export name \"ModuleAIncorrectExportName\", allowed expressions: ModuleAView(**), ModuleASpecial*.",
        ],
      },

      {
        name: "Incorrect export name-case",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {MODULE_A_CREATE} from './create';",
        options,
        errors: [
          "Export of name 'MODULE_A_CREATE' from path 'test/fixtures/exports-example/modules/module-a/create/index.js' wasn't matching rule: Export name \"MODULE_A_CREATE\", allowed expressions: ModuleACreate(**), ModuleASpecial*.",
        ],
      },
      {
        name: 'Element-type matched but export name doesn\'t match "exports.namingConvention"',
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleAListMobileThingy as WrongName} from './list/mobile';",
        options,
        errors: [
          "Export of name 'WrongName' from path 'test/fixtures/exports-example/modules/module-a/list/mobile/index.js' wasn't matching rule: Export name \"WrongName\", allowed expressions: ModuleAList(*Mobile*), ModuleASpecial*.",
        ],
      },

      // Export types
      {
        name: "Exporting * where it's prohibited",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export * from 'modules/module-a/list';",
        options: changeRuleExportOption(options, "allowedTypes", ["declarations", "list"]),
        errors: [
          "Export of name '*' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export type is \"all\", allowed types \"declarations, list\".",
        ],
      },
      // // TODO: Not sure why, but causes "Parsing error: Unexpected token as"
      // {
      //   name: "Exporting * as alias where prohibited",
      //   filename: absoluteFilePath("modules/module-a/index.js"),
      //   code: "export * as ModuleAIncorrectFunction from './list'",
      //   options: changeRuleExportOption(options, "allowedTypes", ["declarations", "list"]),
      //   errors: [
      //     "Export of name '*' from path 'test/fixtures/exports-example/modules/module-a/list/index.js' wasn't matching rule: Export type is \"all\", allowed types \"declarations, list\".",
      //   ],
      // },
      {
        name: "Export default while it's prohibited",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {list as ModuleACreate, listHelper} from 'modules/module-a/create';
        export default ModuleACreate;`,
        options: changeRuleExportOption(options, "allowedTypes", ["list"]),
        errors: [
          "Export of name 'ModuleACreate' from path 'test/fixtures/exports-example/modules/module-a/create/index.js' wasn't matching rule: Export type is \"default\", allowed types \"list\".",
        ],
      },
      {
        name: "Export local declaration",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: 'export const ModuleAValue = "foo"',
        options: changeRuleExportOption(options, "allowedTypes", ["list", "all"]),
        errors: [
          "Export of name 'ModuleAValue' from path 'undefined' wasn't matching rule: Export type is \"declarations\", allowed types \"list, all\".",
        ],
      },
      {
        name: "Export default from incorrect element-type allowed",
        filename: absoluteFilePath("modules/module-b/index.js"),
        code: `import {list as ModuleAList, listHelper} from 'modules/module-a/list';
        export default ModuleAList;`,
        options,
        errors: [
          "No rule allowing this dependency was found. File is of type 'modules' with moduleName 'module-b'. Dependency is of type 'modules-private' with moduleName 'module-a' and functionality 'list'",
        ],
      },
      // Advanced examples
      {
        name: "Multiple kinds of exports where 1 doesn't match",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `import {create as ModuleACreate} from 'modules/module-a/create';
        import {list} from 'modules/module-a/list';
        const localDeclaration = "foo";
        export {ModuleACreate, localDeclaration, list as ModuleAList};`,
        options: options,
        errors: [
          "Export of name 'localDeclaration' from path 'undefined' wasn't matching rule: Export name \"localDeclaration\", allowed expressions: ModuleA(**), ModuleASpecial*.",
        ],
      },
      {
        name: "Export local definition - defined earlier",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: `const ModuleAValue = "foo";
        export {ModuleAValue};`,
        options: changeRuleExportOption(options, "allowedTypes", ["list"]),
        errors: [
          "Export of name 'ModuleAValue' from path 'undefined' wasn't matching rule: Export type is \"declarations\", allowed types \"list\".",
        ],
      },
      {
        name: "Having some export of a bunch that doesn't comply with allowed types",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code:
          `import {create as ModuleACreate, someName} from 'modules/module-a/create';
        import {listMobile as ModuleACreateMobile} from 'modules/module-a/list/mobile'; ` + // #1: Exporting /list/mobile as ModuleACreateMobile
          "export {ModuleACreate, someName as default, ModuleACreateMobile};", // #2: Exporting default where's not allowed
        options: changeRuleExportOption(options, "allowedTypes", ["list", "declarations", "all"]),
        errors: [
          "Export of name 'default' from path 'test/fixtures/exports-example/modules/module-a/create/index.js' wasn't matching rule: Export type is \"default\", allowed types \"list, declarations, all\".",
          "Export of name 'ModuleACreateMobile' from path 'test/fixtures/exports-example/modules/module-a/list/mobile/index.js' wasn't matching rule: Export name \"ModuleACreateMobile\", allowed expressions: ModuleAList(*Mobile*), ModuleASpecial*.",
        ],
      },
      // TODO: Settings that doesn't allow local declarations
      // TODO: Naming shenenigans (re-assigning import values) - not fully supported for cases like
      //  import {a} from "./a";
      //  const b = a;
      //  export {b};
      // It's a bug? It's a feature I dunno but handling this could decrease performance
    ],
  })
);

// testing customErrorMsgs
_test(
  SETTINGS.exportsExample,
  [
    {
      default: "disallow",
      rules: [
        {
          message:
            'Custom error message containing source element-type: "${file.type}", export element-type: "${dependency.type}" and it\'s name "${report.exportName}" and type: "${report.exportType}", report details like name validation error cause: "${report.details.name.errorDetails}"',
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
      ],
    },
  ],
  (options) => ({
    valid: [],
    invalid: [
      // Export allowed names tests
      {
        name: "Testing custom error messages",
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "export {ModuleACreate} from './list';",
        options,
        errors: [
          'Custom error message containing source element-type: "modules", export element-type: "modules-private" and it\'s name "ModuleACreate" and type: "list", ' +
            'report details like name validation error cause: "Export name "ModuleACreate", allowed expressions: ModuleAList(**), ModuleASpecial*."',
        ],
      },
    ],
  })
);
