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

/** Applies values from object to string(s)-template by first flattening object-keys
 * then replacing all found bindings occurrences with object values*/
function replaceObjectValuesInTemplates<T extends string | string[]>(
  strings: T,
  captures: CapturedValues,
  valueProcessorFn: (value: string) => string = (val) => val,
  /* true value for removeUnmatchedBinds causes any of ${} binds that doesn't have matching key in captures to be dropped from final string*/
  removeUnmatchedBinds = false
): T {
  const backwardCompatObject = flattenReplacementObject({
    ...((captures.from as object) ?? {}),
    ...captures,
  });
  const capturesEntries = Object.entries(backwardCompatObject);

  let results = (Array.isArray(strings) ? strings : [strings]).map((string) =>
    capturesEntries.reduce(
      (acc, [keyToReplace, value]) => acc.replace(`\${${keyToReplace}}`, valueProcessorFn(value)),
      string
    )
  );
  if (removeUnmatchedBinds) {
    results = results.map((result) => result.replace(/\$\{.+?\}/g, ""));
  }
  return Array.isArray(strings) ? results : results[0];
}

export { isString, isArray, replaceObjectValuesInTemplates };
