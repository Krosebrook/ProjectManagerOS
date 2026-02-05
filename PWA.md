# PWA Documentation

## Caching Strategy
- **Static Assets**: Stale-while-revalidate.
- **AI Content**: Network-only (never cached).
- **Persistence**: `localStorage` (Offline browsing).

## QualityScore Framework
We measure the PWA health via the following formula:
`QualityScore = (LighthousePWA * 0.4) + (OfflineSuccessRate * 0.3) + (SWActivationTime * 0.2) + (UserInstallRate * 0.1)`

- **Target Score**: > 85/100.
- **Failing Grade**: < 70 (Blocks production deployment).

## Regression Harness (CI/CD)
The following automated gates prevent "template rot":
1. **Manifest Lint**: Validate `short_name`, `icons`, and `start_url`.
2. **SW Build Validation**: Ensure `sw.js` is not empty and contains the `fetch` listener.
3. **Lighthouse Bot**: Comments on PRs with PWA audit results.

## Offline Behavior
- Saved projects in the Dashboard are accessible offline.
- Navigation fallbacks to `index.html`.