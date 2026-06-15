const { getDefaultConfig } = require('expo/metro-config');

// Default Expo Metro config. babel-preset-expo already transforms what
// Reanimated 4 / Worklets need — no custom transformer settings required.
const config = getDefaultConfig(__dirname);

module.exports = config;