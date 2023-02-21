import {isArray, isString, replaceObjectValuesInTemplates} from "./utils";
import {micromatchPatternReplacingObjectsValues} from "./rules";
import {CapturedValues, ElementInfoBase, FileInfo} from "../core/elementsInfo";
import {DependencyInfo} from "../core/dependencyInfo";


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
  elementCapturedValues: CapturedValues): string {

  const micromatchPatternsWithValues = micromatchPatternReplacingObjectsValues(
    micromatchPatterns,
    {from: elementCapturedValues}
  );
  if (Array.isArray(micromatchPatternsWithValues)) {
    if (micromatchPatternsWithValues.length === 1) {
      return quote(micromatchPatternsWithValues[0]);
    }
    return micromatchPatternsWithValues.reduce((message, micromatchPattern, index) => {
      if (index === 0) {
        return quote(micromatchPattern);
      }
      if (index === micromatchPatternsWithValues.length - 1) {
        return `${message} or ${quote(micromatchPattern)}`;
      }
      return `${message}, ${quote(micromatchPattern)}`;
    }, "");
  }
  return quote(micromatchPatternsWithValues);
}

function capturedValuesMatcherMessage(
  capturedValuesPattern: string | string[],
  elementCapturedValues: CapturedValues): string {
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

type ElementInfoPartialWithCaptures =
  Pick<ElementInfoBase, "type" | "internalPath" | "source"> & ElementInfoBase["capturedValues"]

function elementPropertiesToReplaceInTemplate(element: ElementInfoBase):
ElementInfoPartialWithCaptures {

  return {
    ...element.capturedValues,
    type: element.type,
    internalPath: element?.internalPath ?? null,
    source: element?.source ?? null
  };
}

function customErrorMessage(message, file: FileInfo, dependency: DependencyInfo, report = {}): string {
  let replacedMessage = replaceObjectValuesInTemplates(
    replaceObjectValuesInTemplates(message, elementPropertiesToReplaceInTemplate(file), "file"),
    elementPropertiesToReplaceInTemplate(dependency),
    "dependency"
  );
  replacedMessage = replaceObjectValuesInTemplates(
    replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file),
      "from"
    ),
    elementPropertiesToReplaceInTemplate(dependency),
    "target"
  );
  if (file.parents[0]) {
    replacedMessage = replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file.parents[0]),
      "file.parent"
    );
    replacedMessage = replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file.parents[0]),
      "from.parent"
    );
  }
  if (dependency.parents[0]) {
    replacedMessage = replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(dependency.parents[0]),
      "dependency.parent"
    );
    replacedMessage = replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(dependency.parents[0]),
      "target.parent"
    );
  }
  // TODO: Seems like method could return string[], is safe to assume returned value will be a string?
  return replaceObjectValuesInTemplates(replacedMessage, report, "report") as string;
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

export {
  quote,
  ruleElementMessage,
  customErrorMessage,
  elementMessage
};
