# boundaries/no-ignored

> Prevent importing ignored files from recognized elements

## Rule details

It checks `import` statements to local files. If the imported file is marked as ignored in the plugin settings, the `import` will be notified as an error in files recognized as "elements".

### Options

```
"boundaries/no-ignored": [<enabled>]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.

##### Options example

```jsonc
{
  "rules": {
    "boundaries/no-ignored": [2]
  }
}
```

### Settings

Examples in the next sections are based on the previous options example and these files and settings.

```txt
src/
├── helpers/
│   ├── data/
│   │   ├── sort.js
│   │   └── parse.js
│   └── permissions/
│       └── roles.js
│
├── foo.js
└── index.ts
```

```jsonc
{
  "settings": {
    "boundaries/include": ["src/**/*.js"],
    "boundaries/ignore": ["src/foo.js"],
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file",
        "capture": ["category", "elementName"]
      }
    ]
  }
}
```

### Examples of **incorrect** code for this rule:

_`foo.js` file is ignored, so it can't be imported by helpers_

```js
// src/helpers/data/sort.js
import foo from "../../foo"
```

### Examples of **correct** code for this rule:

_`index.ts` file is not recognized as any known element type, so it can import `foo.js`_

```js
// src/index.ts
import foo from "./foo"
```

## Further reading

Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
