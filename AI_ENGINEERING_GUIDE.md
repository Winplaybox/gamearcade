# WinPlayBox Mobile Framework v1.0 — AI Engineering Guide

## Project Goal
You are building a premium React Native application using **Expo SDK (latest)**.
The application must feel as polished as Telegram, Linear, Apple Music, and Notion while maintaining its own identity.
This is **NOT** a Material Design application.
This is **NOT** an iOS clone.
Create a unique WinPlayBox design language inspired by premium mobile applications.
The application must maintain **60–120 FPS** on modern Android devices and remain highly performant on mid-range devices.
Every interaction should feel fluid, responsive, and physically believable.

---

## Core Design Philosophy
Design priorities (highest to lowest):
1. Performance
2. Simplicity
3. Motion
4. Consistency
5. Accessibility
6. Visual Delight

Never sacrifice performance for visual effects.
Every animation must have a purpose.
Avoid unnecessary complexity.

---

## Technology Stack
Only use:
- Expo SDK (latest)
- Expo Router / React Navigation
- TypeScript / Strict JavaScript
- React Native Reanimated (UI Thread 60-120FPS)
- React Native Gesture Handler
- Shopify FlashList (for lists >20 items)
- Expo Image (Memory & Disk Cache, Blurhash, Decoded)
- Expo Blur (Glassmorphism)
- Expo Haptics (Subtle tactile feedback)
- Expo System UI & StatusBar
- @expo/vector-icons (Ionicons primary)
- Zustand (State management)
- TanStack Query (Data fetching)
- @gorhom/bottom-sheet

---

## Forbidden Libraries & Anti-Patterns
Never use:
- NativeBase
- React Native Paper
- UI Kitten
- React Native Elements
- styled-components
- Redux / MobX
- FlatList for large lists (>20 items)
- Default React Native `Image` (Always use Expo Image)
- React Native `Animated` API (Always use Reanimated)

---

## Folder Structure
```
src/
  components/
    ui/           # Reusable WinPlayBox UI Primitives
  navigation/     # Navigators & Tab Layouts
  theme/          # Theme Engine & Custom Providers
    tokens/       # Design Tokens (Colors, Spacing, Radius, Motion, Glass)
  hooks/          # Custom Hooks (Haptics, Orientation, Scroll)
  services/       # API Services, RSS Feed Sync Singleton
  store/          # Zustand Feature Stores
  utils/          # Utility Helpers & Sanitizers
  types/          # Type Definitions
  assets/         # Static Brand Assets
```

---

## Design Token Rules
Never hardcode raw pixels or arbitrary colors in styles.
Every spacing, color, radius, typography, blur, and motion value MUST come from design tokens.

### Spacing Grid (8-point)
Allowed: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

### Radii
Allowed: `8, 12, 16, 20, 24, 32`

---

## Motion & Gesture Principles
1. All animations MUST use React Native Reanimated (`useNativeDriver` / UI thread execution).
2. Every pressable component MUST feature spring scaling:
   `Scale 1.0 ➔ 0.96 ➔ Spring back` (Duration: 120-180ms).
3. Headers & Footers: Floating Telegram-style glass headers with scroll-linked title collapsing and auto-hiding glass footers.
4. Haptics: Subtle feedback on user actions (Favorites, Game Launch, Delete, Filter Apply).

---

## List & Image Rules
1. Always use Shopify `FlashList` for lists with >20 items (`estimatedItemSize` required).
2. Always use `expo-image` for high-performance memory & disk caching.

---

## Developer Rules
Every feature must be:
- Reusable
- Modular
- 60-120 FPS Native UI Thread Performant
- Dark & Theme Aware
- Accessibility Ready
