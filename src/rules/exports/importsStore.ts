import { ImportDeclaration } from "estree";
import { FileInfo } from "../../core/elementsInfo";
import { Cache } from "../../core/cache";
import { DependencyInfo } from "../../core/dependencyInfo";
import { Rule } from "eslint";
import Node = Rule.Node;
type ExtendedImportInfo = DependencyInfo & {
  node: ImportDeclaration & Node;
};
const importsCache = new Cache<Record<string, ExtendedImportInfo>>("imports-cache");

function storeImport(file: FileInfo, dependency: DependencyInfo, node: ImportDeclaration) {
  const cacheKey = file.path;
  const newImportKeys = node.specifiers.reduce(
    (acc, spec) => ({
      ...acc,
      [spec.local.name]: { ...dependency, node },
    }),
    {}
  );
  importsCache.save(file.path, { ...importsCache.load(cacheKey), ...newImportKeys });
}

/** Lookup for specifier*/
function lookupImport(file: FileInfo, specifierName: string): ExtendedImportInfo | null {
  const fileImports = importsCache.load(file.path);
  return (fileImports && fileImports[specifierName]) ?? null;
}

export { storeImport, lookupImport };
