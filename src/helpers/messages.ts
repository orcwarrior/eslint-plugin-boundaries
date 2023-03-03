import { isArray, isString, replaceObjectValuesInTemplates } from "./utils";
import { CapturedValues, ElementInfoBase, FileInfo } from "../core/elementsInfo";
import { DependencyInfo } from "../core/dependencyInfo";

function quote(str: string): string {
  return `'${str}'`;
}

function typeMessage(elementMatcher): string {
  return `elements of type ${quote(elementMatcher)}`;
}

function propertiesConcater(properties: any[], index: number): string {
  if (properties.length > 1 && index === properties.length - 1) {
    return " and";
  }
  if (index === 0) {
    return " with";
  }
  return ",";
}

function micromatchPatternMessage(
  micromatchPatterns: string | string[],
  elementCapturedValues: CapturedValues
): string {
  const parsedPatternValues = replaceObjectValuesInTemplates(micromatchPatterns, {
    from: elementCapturedValues,
  });

  if (Array.isArray(parsedPatternValues)) {
    if (parsedPatternValues.length === 1) {
      return quote(parsedPatternValues[0]);
    }
    return parsedPatternValues.reduce((message, micromatchPattern, index) => {
      if (index === 0) {
        return quote(micromatchPattern);
      }
      if (index === parsedPatternValues.length - 1) {
        return `${message} or ${quote(micromatchPattern)}`;
      }
      return `${message}, ${quote(micromatchPattern)}`;
    }, "");
  }
  return quote(parsedPatternValues);
}

function capturedValuesMatcherMessage(
  capturedValuesPattern: string | string[],
  elementCapturedValues: CapturedValues
): string {
  const capturedValuesPatternKeys = Object.keys(capturedValuesPattern);
  return capturedValuesPatternKeys
    .map((key) => {
      return [key, capturedValuesPattern[key]];
    })
    .reduce((message, propertyNameAndMatcher, index) => {
      return `${message}${propertiesConcater(capturedValuesPatternKeys, index)} ${
        propertyNameAndMatcher[0]
      } ${micromatchPatternMessage(propertyNameAndMatcher[1], elementCapturedValues)}`;
    }, "");
}

function elementMatcherMessage(elementMatcher, elementCapturedValues) {
  if (isString(elementMatcher)) {
    return typeMessage(elementMatcher);
  }
  return `${typeMessage(elementMatcher[0])}${capturedValuesMatcherMessage(
    elementMatcher[1],
    elementCapturedValues
  )}`;
}

function ruleElementMessage(elementPatterns: string[], elementCapturedValues): string {
  if (isArray(elementPatterns)) {
    if (elementPatterns.length === 1) {
      return elementMatcherMessage(elementPatterns[0], elementCapturedValues);
    }
    return elementPatterns.reduce((message, elementPattern, index) => {
      if (index === 0) {
        return elementMatcherMessage(elementPattern, elementCapturedValues);
      }
      return `${message}, or ${elementMatcherMessage(elementPattern, elementCapturedValues)}`;
    }, "");
  }
  return elementMatcherMessage(elementPatterns, elementCapturedValues);
}

type ElementInfoPartialWithCaptures = Pick<ElementInfoBase, "type" | "internalPath" | "source"> &
  ElementInfoBase["capturedValues"];

function elementPropertiesToReplaceInTemplate(
  element: ElementInfoBase
): ElementInfoPartialWithCaptures {
  return {
    ...element.capturedValues,
    type: element.type,
    internalPath: element?.internalPath ?? null,
    source: element?.source ?? null,
  };
}

function customErrorMessage(
  message: string,
  file: FileInfo,
  dependency: DependencyInfo,
  report = {}
): string {
  const fileReplacements = {
    ...elementPropertiesToReplaceInTemplate(file),
    ...(file.parents[0] ? { parent: elementPropertiesToReplaceInTemplate(file.parents[0]) } : {}),
  };
  const dependencyReplacements = {
    ...elementPropertiesToReplaceInTemplate(dependency),
    ...(dependency.parents[0]
      ? { parent: elementPropertiesToReplaceInTemplate(dependency.parents[0]) }
      : {}),
  };
  const fullCapturesObject = {
    file: fileReplacements,
    from: fileReplacements,
    dependency: dependencyReplacements,
    target: dependencyReplacements,
    report,
  };

  return replaceObjectValuesInTemplates(message, fullCapturesObject);
}

function elementCapturedValuesMessage(capturedValues) {
  if (!capturedValues) {
    return "";
  }
  const capturedValuesKeys = Object.keys(capturedValues);
  return capturedValuesKeys
    .map((key) => {
      return [key, capturedValues[key]];
    })
    .reduce((message, propertyNameAndValue, index) => {
      return `${message}${propertiesConcater(capturedValuesKeys, index)} ${
        propertyNameAndValue[0]
      } ${quote(propertyNameAndValue[1])}`;
    }, "");
}

function elementMessage(elementInfo) {
  return `of type ${quote(elementInfo.type)}${elementCapturedValuesMessage(
    elementInfo.capturedValues
  )}`;
}

export { quote, ruleElementMessage, customErrorMessage, elementMessage };
