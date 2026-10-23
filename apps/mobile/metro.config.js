// @ts-check — Config do Metro bundler pro Expo SDK 53 + expo-router 5.x em monorepo pnpm
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname, {
  // Expo Router: usa src/app como root directory
  isReactServer: false,
});

// --- Ajustes para monorepo pnpm ---

// watchFolders: inclui a raiz do workspace pra resolver symlinks do pnpm
config.watchFolders = [...config.watchFolders, __dirname];

// sourceExts: garante que .ts/.tsx/.js/.jsx sejam resolvidos
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter((ext) => ext !== "mjs"),
  "mjs",
  "cjs",
];

// resolver.resolveRequest: fallback pra resolver expo-router/entry no pnpm
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Tenta resolver normalmente primeiro
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Fallback: expo-router/entry precisa do virtual metro entry
    if (moduleName === "expo-router/entry") {
      return context.resolveRequest(
        context,
        require.resolve("expo-router/entry", { paths: [__dirname] }),
        platform
      );
    }
    throw error;
  }
};

module.exports = config;
