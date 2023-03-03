import { Cache } from "../../core/cache";
import { RuleExportsRule } from "./schema";

function capitalize(str: string): string {
  return str[0].toUpperCase() + str.substring(1);
}

type ExportNameConvetion = RuleExportsRule["exports"]["namingConvention"];
const exportNamesUtils = (separators: RegExp) => ({
  toPascal(str: string): string {
    return str.split(separators).map(capitalize).join("");
  },
  toCamel(str: string): string {
    const [first, ...restStr] = str.split(separators);
    return first.toLowerCase() + restStr.map(capitalize).join("");
  },
  toSnakeUpperCase(str: string): string {
    return str.toUpperCase().replace(separators, "_");
  },
  toUpperCase(str: string): string {
    return str.toUpperCase().replace(separators, "");
  },
  toConvention(str: string, convention: ExportNameConvetion) {
    switch (convention) {
      case "camel":
        return this.toCamel(str);
      case "pascal":
        return this.toPascal(str);
      case "snake_uppercase":
        return this.toSnakeUpperCase(str);
      case "upper":
        return this.toUpperCase(str);
    }
  },
});
type ExportNamesUtils = ReturnType<typeof exportNamesUtils>;
const utilsCache = new Cache("export-name-utils");

function buildExportNamesUtils(separators = "[\\s|_|-]+"): ExportNamesUtils {
  const separatorsRgx = new RegExp(separators, "g");
  const cachedUtils = utilsCache.load(separators);

  if (!cachedUtils) {
    const result = exportNamesUtils(separatorsRgx);
    utilsCache.save(separators, result);
    return result;
  } else {
    return cachedUtils;
  }
}
export type { ExportNamesUtils, ExportNameConvetion };
export { buildExportNamesUtils };
