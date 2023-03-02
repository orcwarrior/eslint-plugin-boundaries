import { ExportedModuleInfo } from "./exportedDependency";
import { RuleExportsRule } from "./schema";

type Unpacked<T> = T extends (infer U)[] ? U : T;
type RuleExportType = Unpacked<RuleExportsRule["exports"]["allowedTypes"]>;

function esTreeExportToExportType(type: ExportedModuleInfo["nodeType"]): RuleExportType {
  switch (type) {
    case "ExportAllDeclaration":
      return "all";
    case "ExportDefaultDeclaration":
      return "default";
    case "ExportNamedDeclaration":
      return "list";
    default:
      console.warn(`Node type: "${type}" doesnt match any of defined types`);
      return "default";
  }
}

export { esTreeExportToExportType };
export type { RuleExportType };
