const path = require('path');
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig();
  return {
    ...defaultConfig,
    projectRoot: path.resolve(__dirname),
    watchFolders: [path.resolve(__dirname)],
    transformer: {
      ...defaultConfig.transformer,
      assetRegistryPath: '@react-native/assets-registry/registry.js',
      babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  };
})();
