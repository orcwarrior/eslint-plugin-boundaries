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
  /** All exported names of given token*/
  exportsNames: string[];
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

function exportTypes(node: ExportNode): Pick<ExportedModuleInfo, "exportType" | "nodeType"> {
  return {
    nodeType: node.type,
    exportType: esTreeExportToExportType(node.type),
  };
}
function exportedModuleInfo(
  node: ExportNode,
  context: BoundariesRuleContext,
  file: FileInfo
): ExportedModuleInfo {
  if ("source" in node && node.source) {
    const dependency = dependencyInfo(node.source?.value, context);
    console.log({ exports: dependency });
    if ("specifiers" in node) {
      return {
        ...dependency,
        ...exportTypes(node),
        exportsNames: node.specifiers.map((specifier) => specifier.exported.name),
        node,
        isLocalDefinition: false,
      };
    } else {
      return {
        ...dependency,
        ...exportTypes(node),
        exportsNames: [], // TODO: Can you even determine that somehow?
        node,
        isLocalDefinition: false,
      };
    }
  }
  if (node.type !== "ExportSpecifier" && (node as any)?.specifiers?.length) {
    // There test multiple exports too!
    const specifiers: Array<ESTree.ExportSpecifier & ESTree.Node> = (node as any)?.specifiers;
    const exports = specifiers.map((specifier) => {
      const correspondingDependency = lookupImport(file, specifier.local.name);
      return {
        ...correspondingDependency,
        ...exportTypes(node),
        ...(correspondingDependency
          ? {}
          : {
              exportType: "declarations" as "declarations", // TODO: Drop after multiple declaratios
            }),
        node: correspondingDependency?.node || node,
        exportsNames: [specifier.exported.name], // TODO: Multiple specifiers???
        isLocalDefinition: !correspondingDependency,
      };
    });
    // TODO: Exporting list there
    return exports[0];
  } else if ("declaration" in node && node.declaration) {
    if ("name" in node.declaration) {
      // No info on the export source
      const exportName = node?.declaration?.name;
      // TODO: This can have multiple corresponding dependencies???
      //  -> return array?
      const correspondingDependency = lookupImport(file, exportName);
      // TODO: Retrieve data from the importsStore
      return {
        ...correspondingDependency,
        ...exportTypes(node),
        ...(correspondingDependency ? {} : { exportType: "declarations" }),
        exportsNames: [exportName],
        node: correspondingDependency.node,
        isLocalDefinition: false,
      };
    } else if ("declarations" in node.declaration) {
      const exportsNames = node.declaration.declarations.map(({ id }) => {
        return (id as any).name;
      });
      // TODO: Export array here
      return {
        ...exportTypes(node),
        exportType: "declarations",
        exportsNames,
        node,
        isLocalDefinition: true,
      } as any;
    }
  }
}

export type { ExportedModuleInfo };
export { exportedModuleInfo };
