import {PLUGIN_NAME} from "../constants/plugin";
import chalk from "chalk";
import { ElementInfoBase, FileInfo } from "../core/elementsInfo";

const warns = [];
const debuggedFiles = [];

function trace(message, color): void {
  console.log(chalk[color](`[${PLUGIN_NAME}]: ${message}`));
}

function warn(message: string): void {
  trace(message, "yellow");
}

function debug(message: string): void {
  if (process.env.ESLINT_PLUGIN_BOUNDARIES_DEBUG) {
    trace(message, "grey");
  }
}

function success(message: string): void {
  trace(message, "green");
}

function warnOnce(message: string): void {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
  }
}

function debugFileInfo(fileInfo: FileInfo & ElementInfoBase): void {
  const fileInfoKey = fileInfo.path || fileInfo.source;
  if (process.env.ESLINT_PLUGIN_BOUNDARIES_DEBUG && !debuggedFiles.includes(fileInfoKey)) {
    debuggedFiles.push(fileInfoKey);
    if (fileInfo.type) {
      success(`'${fileInfoKey}' is of type '${fileInfo.type}'`);
    } else {
      warn(`'${fileInfoKey}' is of unknown type`);
    }
    console.log(JSON.stringify(fileInfo, null, 2));
  }
}

export {
  debug,
  success,
  debugFileInfo,
  warnOnce
};
