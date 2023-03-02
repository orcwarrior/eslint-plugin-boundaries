import { dependencyInfo, DependencyInfo } from "../../core/dependencyInfo";
import { BoundariesRuleContext } from "../../rules-factories/dependency-rule";
import { ExportNode } from "./types";
import { FileInfo } from "../../core/elementsInfo";
import { lookupImport } from "./importsStore";
import { Rule } from "eslint";
import Node = Rule.Node;
import * as ESTree from "estree";
import { esTreeExportToExportType, RuleExportType } from "./utils";

type ExportedModuleInfo = DependencyInfo & {
  /** Indicates locally created value beign exported*/
  isLocalDefinition: boolean;
  /** Name of given export-token*/
  exportsName: string;
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
  specifier?: ESTree.ExportSpecifier
): Pick<ExportedModuleInfo, "exportType" | "nodeType"> {
  const isDefaultExport =
    node.type === "ExportDefaultDeclaration" || specifier?.exported?.name === "default";
  return isDefaultExport
    ? { nodeType: "ExportDefaultDeclaration", exportType: "default" }
    : {
        nodeType: node.type,
        exportType: esTreeExportToExportType(node.type),
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
        ...exportTypes(node),
        exportsName: specifier.exported.name,
        node,
        isLocalDefinition: false,
      }));
    } else {
      // Export * declaration
      return [
        {
          ...dependency,
          ...exportTypes(node),
          exportsName: "", // No name for "*" exports
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
      const correspondingDependency = lookupImport(file, specifier.local.name);
      const specifierNode = correspondingDependency?.node || node;
      return {
        ...correspondingDependency,
        ...exportTypes(node as any, specifier),
        node: specifierNode,
        exportsName: specifier.exported.name,
        isLocalDefinition: !correspondingDependency,
      };
    });
  } else if ("declaration" in node && node.declaration) {
    if ("name" in node.declaration) {
      // No info on the export source (list or default)
      const exportName = (node?.declaration as any).name;

      // TODO: This can have multiple corresponding dependencies???
      //  -> return array?
      const correspondingDependency = lookupImport(file, node?.declaration.name);
      // TODO: Retrieve data from the importsStore
      return [
        {
          ...correspondingDependency,
          ...exportTypes(node),
          ...(correspondingDependency ? {} : { exportType: "declarations" }),
          exportsName: exportName,
          node: correspondingDependency.node,
          isLocalDefinition: false,
        },
      ];
    } else if ("declarations" in node.declaration) {
      return node.declaration.declarations.map(({ id }) => ({
        ...exportTypes(node),
        exportType: "declarations",
        exportsName: (id as any).name,
        node,
        isLocalDefinition: true,
      })) as any;
    }
  }
}

export type { ExportedModuleInfo };
export { exportedModuleInfo };
