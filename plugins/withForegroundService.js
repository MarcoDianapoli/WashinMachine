const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICES = [
  'com.supersami.foregroundservice.ForegroundService',
  'com.supersami.foregroundservice.ForegroundServiceTask',
];

module.exports = function withForegroundService(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];
    if (!application) return androidConfig;

    application.service = application.service ?? [];

    for (const serviceName of SERVICES) {
      const existing = application.service.find(
        (service) => service.$?.['android:name'] === serviceName,
      );

      const attributes = {
        'android:name': serviceName,
        'android:exported': 'false',
        'android:foregroundServiceType': 'dataSync',
      };

      if (existing) {
        existing.$ = { ...existing.$, ...attributes };
      } else {
        application.service.push({ $: attributes });
      }
    }

    return androidConfig;
  });
};
