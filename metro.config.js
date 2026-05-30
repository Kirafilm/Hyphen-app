const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const fs = require("fs");
const path = require("path");

/** NativeWind writes platform CSS here; must exist before Metro validates watchFolders. */
function ensureCssInteropCache() {
  try {
    const pkgDir = path.dirname(require.resolve("react-native-css-interop/package.json"));
    fs.mkdirSync(path.join(pkgDir, ".cache"), { recursive: true });
  } catch {
    // Dependencies not installed yet (e.g. pre-install); post-install script also creates this.
  }
}

ensureCssInteropCache();

const config = getDefaultConfig(__dirname);

const finalConfig = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  forceWriteFileSystem: true,
});

// Never watch css-interop cache — EAS fails if the folder is missing at Transformer init.
if (Array.isArray(finalConfig.watchFolders)) {
  finalConfig.watchFolders = finalConfig.watchFolders.filter(
    (folder) => typeof folder === "string" && !folder.includes("react-native-css-interop/.cache"),
  );
}

module.exports = finalConfig;
