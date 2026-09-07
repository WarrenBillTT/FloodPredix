// #region agent log
import { appendFileSync, existsSync } from "fs";
import { join } from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logPath = join(process.cwd(), ".cursor", "debug.log");
const logData = (data) => {
  try {
    const logEntry =
      JSON.stringify({
        location: "postcss.config.js:1",
        message: data.message,
        data: data.data || {},
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: data.hypothesisId || "A",
      }) + "\n";
    appendFileSync(logPath, logEntry, "utf8");
  } catch (e) {}
};
// #endregion

// #region agent log
logData({
  hypothesisId: "A",
  message: "PostCSS config loading - current plugin configuration (POST-FIX)",
  data: {
    usingTailwindcssPostcssPlugin: true,
    hasAutoprefixerPlugin: true,
    configType: "object",
    tailwindVersionInPackageJson: "4.1.3",
    pluginSyntax: "@tailwindcss/postcss: {}",
    fixApplied: true,
  },
});
// #endregion

// #region agent log
try {
  const tailwindcss = require("tailwindcss");
  logData({
    hypothesisId: "B",
    message: "tailwindcss package found via require",
    data: { packageExists: !!tailwindcss, isPostCSSPlugin: false },
  });
} catch (e) {
  logData({
    hypothesisId: "B",
    message: "tailwindcss package require failed",
    data: { error: e.message },
  });
}
// #endregion

// #region agent log
try {
  const tailwindcssPostcss = require("@tailwindcss/postcss");
  logData({
    hypothesisId: "C",
    message: "@tailwindcss/postcss package found (POST-FIX)",
    data: {
      packageExists: !!tailwindcssPostcss,
      installed: true,
      fixApplied: true,
    },
  });
} catch (e) {
  logData({
    hypothesisId: "C",
    message: "@tailwindcss/postcss package NOT found (POST-FIX)",
    data: {
      error: e.message,
      missing: true,
      needsInstall: true,
      code: e.code,
      fixFailed: true,
    },
  });
}
// #endregion

// #region agent log
const nodeModulesPath = join(
  process.cwd(),
  "node_modules",
  "@tailwindcss",
  "postcss"
);
const packageExists = existsSync(nodeModulesPath);
logData({
  hypothesisId: "D",
  message: "Checking @tailwindcss/postcss in node_modules (POST-FIX)",
  data: {
    path: nodeModulesPath,
    exists: packageExists,
    fixApplied: true,
    runId: "post-fix",
  },
});
// #endregion

// #region agent log
import tailwindcssPostcssModule from "@tailwindcss/postcss";
import autoprefixerModule from "autoprefixer";

logData({
  hypothesisId: "E",
  message: "Attempting to import @tailwindcss/postcss plugin explicitly",
  data: {
    pluginImported: !!tailwindcssPostcssModule,
    pluginType: typeof tailwindcssPostcssModule,
    hasDefault: "default" in tailwindcssPostcssModule,
    keys: tailwindcssPostcssModule ? Object.keys(tailwindcssPostcssModule) : [],
    isFunction: typeof tailwindcssPostcssModule === "function",
    isObject: typeof tailwindcssPostcssModule === "object",
  },
});
// #endregion

// #region agent log
logData({
  hypothesisId: "F",
  message: "Autoprefixer module imported",
  data: {
    pluginImported: !!autoprefixerModule,
    pluginType: typeof autoprefixerModule,
    hasDefault: "default" in autoprefixerModule,
  },
});
// #endregion

// #region agent log
const tailwindcssPostcssPlugin =
  tailwindcssPostcssModule?.default || tailwindcssPostcssModule;
const autoprefixerPlugin = autoprefixerModule?.default || autoprefixerModule;

logData({
  hypothesisId: "G",
  message: "Building PostCSS config with explicit imports",
  data: {
    usingExplicitImports: true,
    tailwindcssPostcssAvailable: !!tailwindcssPostcssPlugin,
    autoprefixerAvailable: !!autoprefixerPlugin,
    tailwindcssPostcssIsFunction:
      typeof tailwindcssPostcssPlugin === "function",
    autoprefixerIsFunction: typeof autoprefixerPlugin === "function",
  },
});
// #endregion

export default {
  plugins: {
    "@tailwindcss/postcss": tailwindcssPostcssPlugin || (() => {}),
    autoprefixer: autoprefixerPlugin || (() => {}),
  },
};
