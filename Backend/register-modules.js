/**
 * Permite que Apis/ y Database/ resuelvan dependencias npm instaladas en Backend/node_modules.
 */
const path = require('path');
const Module = require('module');

const backendNodeModules = path.join(__dirname, 'node_modules');
const originalNodeModulePaths = Module._nodeModulePaths;

Module._nodeModulePaths = function nodeModulePaths(from) {
  const paths = originalNodeModulePaths.call(this, from);
  if (!paths.includes(backendNodeModules)) {
    paths.unshift(backendNodeModules);
  }
  return paths;
};
