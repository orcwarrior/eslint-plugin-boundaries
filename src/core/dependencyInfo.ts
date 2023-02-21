import { ElementInfo, ElementInfoBase, fileInfo, ImportInfo, importInfo } from "./elementsInfo";
import {BoundariesRuleContext} from "../rules-factories/dependency-rule";


function getParent(elementInfo: ElementInfo): string {
  const parent = elementInfo.parents && elementInfo.parents[0];
  return parent && parent.elementPath;
}

function getCommonAncestor(elementInfoA: ElementInfo, elementInfoB: ElementInfo): string {
  const commonAncestor = elementInfoA.parents.find((elementParentA) => {
    return !!elementInfoB.parents.find((elementParentB) => {
      return elementParentA.elementPath === elementParentB.elementPath;
    });
  });
  return commonAncestor && commonAncestor.elementPath;
}

function isUncle(elementA: ElementInfo, elementB: ElementInfo): boolean {
  const commonAncestor = getCommonAncestor(elementA, elementB);
  return commonAncestor && commonAncestor === getParent(elementA);
}

function isBrother(elementA: ElementInfo, elementB: ElementInfo): boolean {
  const parentA = getParent(elementA);
  const parentB = getParent(elementB);
  return parentA && parentB && parentA === parentB;
}

function isDescendant(elementA: ElementInfo, elementB: ElementInfo): boolean {
  return !!elementA.parents.find((parent) => parent.elementPath === elementB.elementPath);
}

function isChild(elementA: ElementInfo, elementB: ElementInfoBase): boolean {
  return getParent(elementA) == elementB.elementPath;
}

function isInternal(elementA: ElementInfoBase, elementB: ElementInfoBase): boolean {
  return elementA.elementPath === elementB.elementPath;
}

type DependencyRelationship = "internal" | "child" | "descendant"
| "brother" | "parent" | "uncle" | "ancestor" | null;

function dependencyRelationship(dependency, element): DependencyRelationship {
  if (!dependency.isLocal || dependency.isIgnored || !element.type || !dependency.type) {
    return null;
  }
  if (isInternal(dependency, element)) {
    return "internal";
  }
  if (isChild(dependency, element)) {
    return "child";
  }
  if (isDescendant(dependency, element)) {
    return "descendant";
  }
  if (isBrother(dependency, element)) {
    return "brother";
  }
  if (isChild(element, dependency)) {
    return "parent";
  }
  if (isUncle(dependency, element)) {
    return "uncle";
  }
  if (isDescendant(element, dependency)) {
    return "ancestor";
  }
  return null;
}

type DependencyInfo = ImportInfo & {
  relationship: DependencyRelationship;
  isInternal: boolean
}

function dependencyInfo(source, context: BoundariesRuleContext): DependencyInfo {
  const elementInfo = fileInfo(context);
  const dependency = importInfo(source, context);

  return {
    ...dependency,
    relationship: dependencyRelationship(dependency, elementInfo),
    isInternal: isInternal(dependency, elementInfo)
  };
}

export {dependencyInfo};
export type {DependencyInfo};
