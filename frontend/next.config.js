
const path = require("path");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Stub out internal optional modules that don't ship in npm bundles
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      // wagmi v2 internal tempo module — not used at runtime
      accounts: false,
      // node built-ins not available in browser
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Silence "Critical dependency: the request of a dependency is an expression" from cardano-sdk
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;
