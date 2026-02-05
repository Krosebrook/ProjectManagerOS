# Testing Strategy

## 1. PWA Regression Suite
To be run in CI using **Lighthouse CI** or **Playwright**:
- **Installability Check**: Validate `manifest.json` and icons.
- **Service Worker Check**: Ensure SW registers and intercepts fetches.
- **Offline Smoke Test**:
  1. Load application while online.
  2. Toggle network to offline.
  3. Navigate to Dashboard and verify cached projects are visible.

## 2. Unit & Integration
- **Gemini Service**: Mock `@google/genai` to verify task hydration and ID generation.
- **Components**: Test `Button` loading states and `Layout` navigation.

## 3. Performance & Accessibility
- **Target**: Lighthouse score > 90 in all categories.
- **A11y**: Manual check for ARIA labels on task toggles and modal focus.

## 4. Commands
```bash
# Linting
npx eslint .

# PWA Validation (Local)
npx lighthouse http://localhost:3000 --view --only-categories=pwa
```