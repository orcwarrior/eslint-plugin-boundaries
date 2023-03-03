import { PLUGIN_NAME, EslintPluginName } from "./plugin";
import {
  ELEMENT_TYPES,
  EXTERNAL,
  ENTRY_POINT,
  NO_IGNORED,
  NO_UNKNOWN,
  NO_PRIVATE,
  NO_UNKNOWN_FILES,
  EXPORTS,
  Rules,
} from "./rules";

type PluginSettingKeys = {
  ELEMENTS: `${EslintPluginName}/elements`;
  IGNORE: `${EslintPluginName}/ignore`;
  INCLUDE: `${EslintPluginName}/include`;

  // rules
  RULE_ELEMENT_TYPES: `${EslintPluginName}/${Rules["ELEMENT_TYPES"]}`;
  RULE_ENTRY_POINT: `${EslintPluginName}/${Rules["ENTRY_POINT"]}`;
  RULE_EXTERNAL: `${EslintPluginName}/${Rules["EXTERNAL"]}`;
  RULE_EXPORTS: `${EslintPluginName}/${Rules["EXPORTS"]}`;
  RULE_NO_IGNORED: `${EslintPluginName}/${Rules["NO_IGNORED"]}`;
  RULE_NO_PRIVATE: `${EslintPluginName}/${Rules["NO_PRIVATE"]}`;
  RULE_NO_UNKNOWN_FILES: `${EslintPluginName}/${Rules["NO_UNKNOWN_FILES"]}`;
  RULE_NO_UNKNOWN: `${EslintPluginName}/${Rules["NO_UNKNOWN"]}`;

  // deprecated settings
  TYPES: `${EslintPluginName}/types`;
  ALIAS: `${EslintPluginName}/alias`;

  // elements settings properties,
  VALID_MODES: ["folder", "file", "full"];
};
const settings: PluginSettingKeys = {
  // settings
  ELEMENTS: `${PLUGIN_NAME}/elements`,
  IGNORE: `${PLUGIN_NAME}/ignore`,
  INCLUDE: `${PLUGIN_NAME}/include`,

  // rules
  RULE_ELEMENT_TYPES: `${PLUGIN_NAME}/${ELEMENT_TYPES}`,
  RULE_ENTRY_POINT: `${PLUGIN_NAME}/${ENTRY_POINT}`,
  RULE_EXTERNAL: `${PLUGIN_NAME}/${EXTERNAL}`,
  RULE_EXPORTS: `${PLUGIN_NAME}/${EXPORTS}`,
  RULE_NO_IGNORED: `${PLUGIN_NAME}/${NO_IGNORED}`,
  RULE_NO_PRIVATE: `${PLUGIN_NAME}/${NO_PRIVATE}`,
  RULE_NO_UNKNOWN_FILES: `${PLUGIN_NAME}/${NO_UNKNOWN_FILES}`,
  RULE_NO_UNKNOWN: `${PLUGIN_NAME}/${NO_UNKNOWN}`,

  // deprecated settings
  TYPES: `${PLUGIN_NAME}/types`,
  ALIAS: `${PLUGIN_NAME}/alias`,

  // elements settings properties,
  VALID_MODES: ["folder", "file", "full"],
};

export const ELEMENTS = settings.ELEMENTS;
export const IGNORE = settings.IGNORE;
export const INCLUDE = settings.INCLUDE;
export const RULE_ELEMENT_TYPES = settings.RULE_ELEMENT_TYPES;
export const RULE_ENTRY_POINT = settings.RULE_ENTRY_POINT;
export const RULE_EXTERNAL = settings.RULE_EXTERNAL;
export const RULE_EXPORTS = settings.RULE_EXPORTS;
export const RULE_NO_IGNORED = settings.RULE_NO_IGNORED;
export const RULE_NO_PRIVATE = settings.RULE_NO_PRIVATE;
export const RULE_NO_UNKNOWN_FILES = settings.RULE_NO_UNKNOWN_FILES;
export const RULE_NO_UNKNOWN = settings.RULE_NO_UNKNOWN;
export const TYPES = settings.TYPES;
export const ALIAS = settings.ALIAS;
export const VALID_MODES = settings.VALID_MODES;
