import { CapturedValues } from "../core/elementsInfo";

function isString(object): boolean {
  return typeof object === "string";
}

function isArray(object): boolean {
  return Array.isArray(object);
}

/** Creates flatten version of any level object.
 * @example flattenReplacementObject({foo: {bar: "test"}, isFlatten: true}) =>
 * {"foo.bar": "test", isFlatten: true}*/
function flattenReplacementObject(object: CapturedValues, keyPrefix?: string): Record<string, string> {
  if (typeof object === "undefined" || object === null) {
    return {};
  }
  return Object.entries(object).reduce((flatten, [key, value]) => {
    const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;
    return {
      ...flatten,
      ...(typeof value === "object"
        ? flattenReplacementObject(value, fullKey) // Recurrently flatten object-value, passing fullKey as a prefix
        : { [fullKey]: value }), // regular string - just assign
    };
  }, {});
}

function replaceObjectValuesInTemplates<T extends string | string[]>(
  strings: T,
  object: CapturedValues,
  valueProcessorFn: (value: string) => string = (val) => val
): T {
  const backwardCompatObject = flattenReplacementObject({
    ...((object.from as object) ?? {}),
    ...object,
  });
  const capturesEntries = Object.entries(backwardCompatObject);

  const result = (Array.isArray(strings) ? strings : [strings]).map((string) =>
    capturesEntries.reduce(
      (acc, [keyToReplace, value]) => acc.replace(`\${${keyToReplace}}`, valueProcessorFn(value)),
      string
    )
  );
  return Array.isArray(strings) ? result : result[0];
}

export { isString, isArray, replaceObjectValuesInTemplates };
