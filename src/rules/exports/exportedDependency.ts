import { dependencyInfo, DependencyInfo } from "../../core/dependencyInfo";
import { BoundariesRuleContext } from "../../rules-factories/dependency-rule";
import { ExportNode } from "./types";
import { FileInfo } from "../../core/elementsInfo";
import { getImportDeclaration } from "./importsStore";
import { Rule } from "eslint";
import Node = Rule.Node;
import * as ESTree from "estree";
import { esTreeExportToExportType, RuleExportType } from "./utils";

type ExportedModuleInfo = DependencyInfo & {
  /** Indicates locally created value beign exported*/
  isLocalDefinition: boolean;
  /** Name of given export-token*/
  exportName: string;
  /** Type of export syntax*/
  nodeType:
    | "ExportAllDeclaration"
    | "ExportNamedDeclaration"
    | "ExportDefaultDeclaration"
    | "ExportSpecifier";
  exportType: RuleExportType;
  /** ExportNode or previously stored ImportNode which gets exported currently*/
  node: Node;
};

function exportTypes(
  node: ExportNode,
  specifier?: ESTree.ExportSpecifier,
  file?: FileInfo
): Pick<ExportedModuleInfo, "exportType" | "nodeType" | "isLocalDefinition"> {
  // Locally defined exports:

  const isDefaultExport =
    node.type === "ExportDefaultDeclaration" || specifier?.exported?.name === "default";
  if (isDefaultExport) {
    return { nodeType: "ExportDefaultDeclaration", exportType: "default", isLocalDefinition: false };
  } else if (specifier && file) {
    const correspondingDependency = getImportDeclaration(file, specifier.local.name);
    if (!correspondingDependency) {
      return { nodeType: node.type, exportType: "declarations", isLocalDefinition: true };
    }
  }

  return {
    nodeType: node.type,
    exportType: esTreeExportToExportType(node.type),
    isLocalDefinition: false,
  };
}

function exportedModuleInfo(
  node: ExportNode,
  context: BoundariesRuleContext,
  file: FileInfo
): ExportedModuleInfo[] {
  if ("source" in node && node.source) {
    // exports directly from another file
    const dependency = dependencyInfo(node.source?.value, context);
    if ("specifiers" in node) {
      return node.specifiers.map((specifier) => ({
        ...dependency,
        ...exportTypes(node, specifier, file),
        exportName: specifier.exported.name,
        node,
      }));
    } else {
      // Export * declaration
      return [
        {
          ...dependency,
          ...exportTypes(node),
          exportName: "", // No name for "*" exports
          node,
          isLocalDefinition: false,
        },
      ];
    }
  }
  if (node.type !== "ExportSpecifier" && (node as any)?.specifiers?.length) {
    // There test multiple exports too!
    const specifiers: Array<ESTree.ExportSpecifier & ESTree.Node> = (node as any)?.specifiers;
    return specifiers.map((specifier) => {
      const correspondingDependency = getImportDeclaration(file, specifier.local.name);
      const specifierNode = correspondingDependency?.node || node;
      return {
        ...correspondingDependency,
        ...exportTypes(node, specifier, file),
        node: specifierNode,
        exportName: specifier.exported.name,
      };
    });
  } else if ("declaration" in node && node.declaration) {
    if ("name" in node.declaration) {
      // No info on the export source (list or default)
      const correspondingDependency = getImportDeclaration(file, node?.declaration.name);
      const specifierNode = correspondingDependency?.node ?? node;
      return [
        {
          ...correspondingDependency,
          ...exportTypes(node),
          ...(correspondingDependency ? {} : { exportType: "declarations" }),
          exportName: node?.declaration.name,
          node: specifierNode, // TODO: Could cause regression
          isLocalDefinition: !correspondingDependency,
        },
      ];
    } else if ("declarations" in node.declaration) {
      return node.declaration.declarations.map(({ id }) => ({
        ...exportTypes(node),
        exportType: "declarations",
        exportName: (id as any).name,
        node,
        isLocalDefinition: true,
      })) as any;
    }
  }
}

export type { ExportedModuleInfo };
export { exportedModuleInfo };
