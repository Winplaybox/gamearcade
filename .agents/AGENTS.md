# Project Rules — Winplaybox Games Arcade

## Version Bumping Rule
- Whenever changes are made to the codebase or before committing/releasing, automatically update the application version numbers:
  - Increment `version` in both [app.json](file:///d:/Project/gamearcade/app.json) and [package.json](file:///d:/Project/gamearcade/package.json) (e.g. `1.0.0` -> `1.0.1`).
  - Increment `android.versionCode` in [app.json](file:///d:/Project/gamearcade/app.json) (e.g. `1` -> `2`).

## Android Production Release Signing Rule
- Whenever creating an Android release build or `.aab` bundle for the Google Play Store:
  - ALWAYS use the official production keystore located at [android/app/release.keystore](file:///d:/Project/gamearcade/android/app/release.keystore).
  - Ensure [android/app/build.gradle](file:///d:/Project/gamearcade/android/app/build.gradle) maintains `signingConfig signingConfigs.release` for `buildTypes.release`. NEVER revert to `signingConfigs.debug`.

## Strict Execution Directive
- NEVER automatically run `git commit`, `git push`, or build commands (`gradlew bundleRelease`, `eas build`) unless the USER explicitly requests a commit or build in their message.

## GitHub Tagging & Release Rule
- Whenever an explicit release build is requested by the user:
  - Create and push a semantic version tag starting with `v` (e.g. `v1.0.0` matching `app.json` version).
  - Format release notes clearly with feature highlights, performance improvements, and multi-language Play Store XML tags.

## Expo Documentation & Implementation Rule
- ALWAYS search for and follow the official Expo documentation before implementing new features, modules, or making architectural changes (e.g., `expo-store-review`, `expo-sqlite`, `expo-blur`).
- For modern Expo bare workflows (SDK 50+), rely on Expo Autolinking. If a module requires native setup, run `npx install-expo-modules@latest` to auto-configure `MainActivity.kt` / `MainApplication.kt` rather than editing them manually.
- When installing ANY new Expo module that includes native code (like `expo-blur`, `expo-sqlite`, or `expo-store-review`), ALWAYS remind the user to rebuild the native app using `npx expo run:android` because JavaScript hot-reloading will not inject new native dependencies.

## UI Theme Rule
- NEVER use hardcoded hex colors (e.g. #FFFFFF, #E94560) for styling components.
- ALWAYS use the theme tokens provided by ThemeContext (e.g., theme.text, theme.primary, theme.bg).
- This ensures a single source of truth for all colors and enables dynamic theming (Light/Dark mode) in the future.

## Google Play Console App Setup Guide (AdMob & Firebase Apps)
Whenever you are setting up a new app on the Google Play Console that uses **Google AdMob** (for monetization) and **Firebase** (Analytics/Crashlytics) without a user login system, follow this standardized configuration. 

### 1. App Access (Sign-in Details)
- **Selection:** `No, no part of the app is restricted.`

### 2. Content Rating
- **Category:** `Game` (for arcade apps) or `All Other App Types` / `Utility` (for browser apps).
- **Questionnaire Answers:** Select `No` for ALL categories (Violence, Fear, Sexuality, Gambling, Language, Substances, Crude Humor, Digital Purchases/NFTs).
- **Result:** You will achieve a universal **PEGI 3 / "Everyone" / All Ages** rating globally.

### 3. Target Audience and Content
To avoid strict children's privacy laws (COPPA / Designed for Families program) which restrict you from using standard AdMob ads, you must target audiences 13 and older.
- **Target Age Group:** `13-15`, `16-17`, and `18 and over`. *(Never select 12 and under).*
- **Appeal to Children Question:** `No`.

### 4. Data Safety
AdMob and Firebase automatically collect diagnostic data and advertising IDs. You must declare this to stay compliant.
- **Collects required user data types?** `Yes`
- **Data encrypted in transit?** `Yes`
- **Account Creation:** `My app does not allow users to create an account.`
- **Request Data Deletion:** `Yes` *(Provide privacy policy link)*.

#### Data Types to Declare:
1. **App Activity ➔ Page views and taps in app:**
   - Collected, Not ephemeral, Required, Analytics.
2. **App Info and Performance ➔ Crash logs & Diagnostics:**
   - Collected, Not ephemeral, Required, Analytics.
3. **Device or other IDs ➔ Device or other IDs (Advertising AAID):**
   - Collected AND Shared, Not ephemeral, Required, Advertising or Marketing AND Analytics.

### 5. Advertising ID
Because the app uses Google AdMob (`react-native-google-mobile-ads`), it automatically uses the Android Advertising ID to serve ads.
- **Does your app use advertising ID?** `Yes`
- **Why do you need to use the advertising ID?** Check `Advertising or marketing` and `Analytics`.
