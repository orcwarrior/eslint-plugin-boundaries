import resolve from "resolve";

const getUsedAlias = (relativeFilePath, config) => {
  return Object.keys(config).find((alias) => relativeFilePath.indexOf(alias) === 0);
};

const replaceAliases = (filePath, config) => {
  const usedAlias = getUsedAlias(filePath, config);
  if (usedAlias) {
    return filePath.replace(usedAlias, config[usedAlias]);
  }
  return filePath;
};

// Temporarily keep it as module.exports as tons of test configs rely on this being exported that way
module.exports = {
  interfaceVersion: 2,
  resolve: function (source, _file, config) {
    if (resolve.isCore(source)) {return {found: true, path: null};}
    try {
      return {
        found: true,
        path: resolve.sync(replaceAliases(source, config), {basedir: process.cwd()})
      };
    } catch (err) {
      return {found: false};
    }
  }
};
