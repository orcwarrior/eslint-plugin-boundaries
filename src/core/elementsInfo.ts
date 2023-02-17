import type {BoundariesRuleContext} from "../rules-factories/dependency-rule";
import isCoreModule from "is-core-module";
import micromatch from "micromatch";
import resolve from "eslint-module-utils/resolve";
import {IGNORE, INCLUDE, VALID_MODES} from "../constants/settings";
import {getElements} from "../helpers/settings";
import {debugFileInfo} from "../helpers/debug";
import {elementsCache, filesCache, importsCache} from "./cache";
import {
  BoundariesConfigSettings, BoundariesElement,
  ElementType
} from "../configs/EslintPluginConfig";


function baseModule(name: string, path?: string): string | null {
  if (path) {
    return null;
  }
  if (isScoped(name)) {
    const [scope, packageName] = name.split("/");
    return `${scope}/${packageName}`;
  }
  const [pkg] = name.split("/");
  return pkg;
}

function matchesIgnoreSetting(path: string, settings: BoundariesConfigSettings): boolean {
  return micromatch.isMatch(path, settings[IGNORE] || []);
}

function isIgnored(path: string, settings: BoundariesConfigSettings): boolean {
  if (!path) {
    return true;
  }
  if (settings[INCLUDE]) {
    if (micromatch.isMatch(path, settings[INCLUDE])) {
      return matchesIgnoreSetting(path, settings);
    }
    return true;
  }
  return matchesIgnoreSetting(path, settings);
}

function isBuiltIn(name, path) {
  if (path || !name) {
    return false;
  }
  const base = baseModule(name);
  return isCoreModule(base);
}

const scopedRegExp = /^@[^/]*\/?[^/]+/;

function isScoped(name): boolean {
  return name && scopedRegExp.test(name);
}

const externalModuleRegExp = /^\w/;

function isExternal(name, path) {
  return (
    (!path || (!!path && path.includes("node_modules"))) &&
    (externalModuleRegExp.test(name) || isScoped(name))
  );
}

/** Maps captured subpaths to object with keys based on "boundaries/elements".capture */
function elementCaptureValues(capture: string[], captureSettings: BoundariesElement["capture"]
): Record<string, string> {
  if (!captureSettings) {
    return null;
  }
  return capture.reduce((captureValues, captureValue, index) => {
    if (captureSettings[index]) {
      captureValues[captureSettings[index]] = captureValue;
    }
    return captureValues;
  }, {});
}

/** Reverts path manipulations done by elementTypeAndParents() reducer sub-path of matched element ?? */
function getElementPath(pattern: string, pathSegmentsMatching: string[], fullPath: string[]) {
  // Get full left side of the path matching pattern (full element path except internal files)
  const elementPathRegexp = micromatch.makeRe(pattern);
  const testedSegments = [];
  let result;
  pathSegmentsMatching.forEach((pathSegment) => {
    if (!result) {
      testedSegments.push(pathSegment);
      const joinedSegments = testedSegments.join("/");
      if (elementPathRegexp.test(joinedSegments)) {
        result = joinedSegments;
      }
    }
  });
  return `${[...fullPath].reverse().join("/").split(result)[0]}${result}`;
}
/** micromatch captured element subfolders as object keyed by settings "boundaries/elements".capture */
type CapturedValues = Record<string, string> | null;

type ElementInfo = {
  type: ElementType | null;
  /** Sub-path of the found element ???*/
  elementPath: string | null;
  /** micromatch captured element subfolders list*/

  capture: string[] | null;
  /** micromatch captured element subfolders as object keyed by settings "boundaries/elements".capture */
  capturedValues: CapturedValues;
  /** TODO: Not entirely sure what it's*/
  internalPath: any | null;

  parents: Omit<ElementInfo, "parents" | "internalPath">[]
}

function elementTypeAndParents(path: string, settings: BoundariesConfigSettings): ElementInfo {
  const parents: ElementInfo["parents"] = [];
  const elementResult: ElementInfo = {
    type: null,
    elementPath: null,
    capture: null,
    capturedValues: null,
    internalPath: null,
    parents
  };

  if (isIgnored(path, settings)) {
    return elementResult;
  }

  path
    .split("/")
    .reverse()
    .reduce(
      ({accumulator, lastSegmentMatching}, elementPathSegment, segmentIndex, elementPaths) => {
        accumulator.unshift(elementPathSegment);
        let elementFound = false;
        getElements(settings).forEach((element) => {
          const typeOfMatch = element.mode ?? VALID_MODES[0];
          const elementPatterns = Array.isArray(element.pattern)
            ? element.pattern
            : [element.pattern];

          elementPatterns.forEach((elementPattern) => {
            if (!elementFound) {
              const useFullPathMatch = typeOfMatch === VALID_MODES[2] && !elementResult.type;
              const pattern = typeOfMatch === VALID_MODES[0] && !elementResult.type
                ? `${elementPattern}/**/*`
                : elementPattern;
              let basePatternCapture = true, basePatternCaptureMatch;

              if (element.basePattern) {
                basePatternCaptureMatch = micromatch.capture(
                  [element.basePattern, "**", pattern].join("/"),
                  path
                    .split("/")
                    .slice(0, path.split("/").length - lastSegmentMatching)
                    .join("/")
                );
                basePatternCapture = !!basePatternCaptureMatch;
              }
              const capture = micromatch.capture(
                pattern,
                useFullPathMatch ? path : accumulator.join("/")
              );

              if (capture && basePatternCapture) {
                elementFound = true;
                lastSegmentMatching = segmentIndex + 1;
                let capturedValues = elementCaptureValues(capture, element.capture);
                if (element.basePattern) {
                  capturedValues = {
                    ...elementCaptureValues(basePatternCaptureMatch, element.baseCapture),
                    ...capturedValues
                  };
                }
                const elementPath = useFullPathMatch
                  ? path
                  : getElementPath(elementPattern, accumulator, elementPaths);
                accumulator = [];
                if (!elementResult.type) {
                  elementResult.type = element.type;
                  elementResult.elementPath = elementPath;
                  elementResult.capture = capture;
                  elementResult.capturedValues = capturedValues;
                  elementResult.internalPath =
                    typeOfMatch === VALID_MODES[0]
                      ? path.replace(`${elementPath}/`, "")
                      : elementPath.split("/").pop();
                } else {
                  parents.push({
                    type: element.type,
                    elementPath: elementPath,
                    capture: capture,
                    capturedValues: capturedValues
                  });
                }
              }
            }
          });
        });
        return {accumulator, lastSegmentMatching};
      },
      {accumulator: [], lastSegmentMatching: 0}
    );

  return {
    ...elementResult,
    parents
  };
}

function replacePathSlashes(absolutePath: string): string {
  return absolutePath.replace(/\\/g, "/");
}

/** From absolute path to project-relative path */
function projectPath(absolutePath: string): string {
  if (absolutePath) {
    return replacePathSlashes(absolutePath).replace(`${replacePathSlashes(process.cwd())}/`, "");
  }
}

type FileInfo = ElementInfo & {
  /** Project-relative path*/
  path: string;
  isIgnored: boolean;
};
type ImportInfo = FileInfo & {
  source,
  isLocal: boolean;
  isBuiltIn: boolean;
  isExternal: boolean;
  /** Base module in case it's an external module import */
  baseModule: string | null;
};

function importInfo(source: string, context: BoundariesRuleContext): ImportInfo {
  const path = projectPath(resolve(source, context));
  const isExternalModule = isExternal(source, path);
  const resultCache = importsCache.load(isExternalModule ? source : path, context.settings);
  let elementCache;
  let result: ImportInfo;
  let elementResult: ElementInfo;

  if (resultCache) {
    result = resultCache;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    const isBuiltInModule = isBuiltIn(source, path);
    const pathToUse = isExternalModule ? null : path;
    if (elementCache) {
      elementResult = elementCache;
    } else {
      elementResult = elementTypeAndParents(pathToUse, context.settings);
      elementsCache.save(pathToUse, elementResult, context.settings);
    }

    result = {
      source,
      path: pathToUse,
      isIgnored: !isExternalModule && isIgnored(pathToUse, context.settings),
      isLocal: !isExternalModule && !isBuiltInModule,
      isBuiltIn: isBuiltInModule,
      isExternal: isExternalModule,
      baseModule: baseModule(source, pathToUse),
      // TODO: Consider suggestion to simplify the code (2nd argument could be dropped then)
      // baseModule: isExternalModule ? baseModule(source) : null,
      ...elementResult
    };

    importsCache.save(path, result, context.settings);

    if (result.isLocal) {
      debugFileInfo(result);
    }
  }
  return result;
}

function fileInfo(context: BoundariesRuleContext): FileInfo {
  const path = projectPath(context.getFilename());
  const resultCache = filesCache.load(path, context.settings);
  let elementCache;
  let result: FileInfo;
  let elementResult: ElementInfo;
  if (resultCache) {
    result = resultCache;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    if (elementCache) {
      elementResult = elementCache;
    } else {
      elementResult = elementTypeAndParents(path, context.settings);
      elementsCache.save(path, elementResult, context.settings);
    }
    result = {
      path,
      isIgnored: isIgnored(path, context.settings),
      ...elementResult
    };
    filesCache.save(path, result, context.settings);
    debugFileInfo(result);
  }
  return result;
}

export {
  importInfo,
  fileInfo
};
export type {CapturedValues, ElementInfo, FileInfo, ImportInfo};
