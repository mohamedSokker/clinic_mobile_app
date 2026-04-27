export default ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      googleServicesFile: process.env.appleConfig || "./GoogleService-Info.plist",
    },
    android: {
      ...config.android,
      googleServicesFile: process.env.androidConfig || "./google-services.json",
    },
  };
};
