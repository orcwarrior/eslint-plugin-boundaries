import * as ESTree from "estree";
import { Rule } from "eslint";

type ExportNodeWithoutSource =
  | ESTree.ExportAllDeclaration
  | ESTree.ExportDefaultDeclaration
  | ESTree.ExportSpecifier;
type ExportNode = Rule.Node &
  Rule.NodeParentExtension &
  (ESTree.ExportNamedDeclaration | ExportNodeWithoutSource);

export { ExportNode, ExportNodeWithoutSource };
