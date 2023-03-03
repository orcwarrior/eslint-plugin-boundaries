import { EslintPluginConfig } from "./EslintPluginConfig";

const recommended: EslintPluginConfig = {
  plugins: ["boundaries"],
  rules: {
    "boundaries/element-types": [2],
    "boundaries/entry-point": [2],
    "boundaries/external": [2],
    "boundaries/no-ignored": 0,
    "boundaries/no-private": [2, { allowUncles: true }],
    "boundaries/no-unknown-files": 0,
    "boundaries/no-unknown": 0,
    "boundaries/exports": 0,
  },
  settings: {
    "boundaries/elements": [],
    "boundaries/ignore": ["**/*.spec?.js", "**/*.test?.js"],
  },
};

export { recommended };
