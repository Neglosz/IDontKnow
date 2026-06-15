// Expo SDK 54 + Reanimated 4:
// Do NOT add 'react-native-reanimated/plugin' or 'react-native-worklets/plugin'
// here — babel-preset-expo already includes the Worklets Babel plugin for you.
// Adding it manually causes a conflict / "Exception in HostFunction".
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};