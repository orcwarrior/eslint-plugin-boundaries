import {CapturedValues} from "../core/elementsInfo";

function isString(object): boolean {
  return typeof object === "string";
}

function isArray(object): boolean {
  return Array.isArray(object);
}

function replaceObjectValueInTemplate(
  template: string,
  key: string,
  value: string,
  namespace?: string): string {

  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  return template.replace(`\${${keyToReplace}}`, value);
}

function replaceObjectValuesInTemplates(
  strings: string | string[],
  object: CapturedValues,
  namespace?: string): string | string[] {
  
  return Object.keys(object).reduce((result, objectKey) => {
    // If template is an array, replace key by value in all patterns
    if (Array.isArray(result)) {
      return result.map((resultEntry) => {
        return replaceObjectValueInTemplate(resultEntry, objectKey, object[objectKey], namespace);
      });
    } else {
      return replaceObjectValueInTemplate(result, objectKey, object[objectKey], namespace);
    }
  }, strings);
}

export {
  isString,
  isArray,
  replaceObjectValuesInTemplates
};
