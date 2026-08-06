const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to pass -Xskip-metadata-version-check to Kotlin compiler.
 * This allows Kotlin 2.1 to compile dependencies using newer Kotlin 2.3+ metadata
 * (such as play-services-ads 25.4.0 with AgeRestrictedTreatment).
 */
module.exports = function withPlayServicesAdsFix(config) {
  return withProjectBuildGradle(config, (configResults) => {
    if (configResults.modResults.language === 'groovy') {
      const fix = `
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += ["-Xskip-metadata-version-check"]
        }
    }
}
`;
      if (!configResults.modResults.contents.includes('-Xskip-metadata-version-check')) {
        configResults.modResults.contents += fix;
      }
    }
    return configResults;
  });
};
