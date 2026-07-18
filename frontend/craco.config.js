// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      // Some published npm packages (e.g. newer @radix-ui/* releases) ship
      // .mjs files with a sourceMappingURL comment pointing at a path that
      // only exists in the package author's own monorepo, not in a
      // consumer's node_modules — yarn hoists the actual dependency instead
      // of nesting it, so source-map-loader's read of that literal path
      // 404s with ENOENT and CRA surfaces it as a hard compile error rather
      // than a warning. Source maps for third-party libraries aren't needed
      // for debugging this app's own code, so skip that loader for
      // node_modules entirely instead of playing whack-a-mole per package.
      const usesSourceMapLoader = (use) => {
        if (!use) return false;
        if (typeof use === "string") return use.includes("source-map-loader");
        if (Array.isArray(use)) return use.some(usesSourceMapLoader);
        if (typeof use === "object") return usesSourceMapLoader(use.loader);
        return false;
      };
      const sourceMapRule = webpackConfig.module.rules.find((rule) => usesSourceMapLoader(rule.use) || usesSourceMapLoader(rule.loader));
      if (sourceMapRule) {
        sourceMapRule.exclude = /node_modules/;
      }

      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => {
  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

// Wrap with visual edits (automatically adds babel plugin, dev server, and overlay in dev mode)
// NOTE: this plugin is only meaningful inside Emergent's own cloud editor
// (it powers their "click to edit" overlay). On a normal local machine it
// serves no purpose and can crash webpack on larger files, so it's now
// opt-in — set EMERGENT_VISUAL_EDITS=true in your .env to re-enable it.
if (isDevServer && process.env.EMERGENT_VISUAL_EDITS === "true") {
  try {
    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
    webpackConfig = withVisualEdits(webpackConfig);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
      console.warn(
        "[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled."
      );
    } else {
      throw err;
    }
  }
}

module.exports = webpackConfig;