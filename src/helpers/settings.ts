import {
  BoundariesConfigSettings,
  BoundariesElement,
  ElementType,
  EslintPluginConfig
} from "../configs/EslintPluginConfig";
import { ELEMENTS, TYPES, VALID_MODES } from "../constants/settings";
import { isString } from "./utils";


function isLegacyType(type) {
  return isString(type);
}

type Settings = EslintPluginConfig["settings"];

// TODO, remove in next major version
function transformLegacyTypes(typesFromSettings: Settings["boundaries/elements"] | any): Settings["boundaries/elements"] {
  const types = typesFromSettings || [];
  return types.map((type) => {
    // backward compatibility with v1
    if (isLegacyType(type)) {
      return {
        type: type,
        match: VALID_MODES[0],
        pattern: `${type}/*`,
        capture: ["elementName"]
      };
    }
    // default options
    return {
      match: VALID_MODES[0],
      ...type
    };
  });
}

/** Get Eslint Config object that */
function getElements(settings: EslintPluginConfig["settings"]): BoundariesElement[] {
  return transformLegacyTypes(settings[ELEMENTS] || settings[TYPES]);
}

function getElementsTypeNames(settings: EslintPluginConfig["settings"]): ElementType[] {
  return getElements(settings).map((element) => element.type);
}

export {
  isLegacyType,
  getElements,
  getElementsTypeNames
};
