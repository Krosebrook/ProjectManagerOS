# Observability Strategy

## 1. PWA Lifecycle Monitoring
Track the following events via telemetry (e.g., Sentry or LogRocket):
- `sw.install_failed`: Captured in the SW registration catch block.
- `sw.activated`: Milestone for update rollouts.
- `pwa.installed`: Track `appinstalled` event for conversion metrics.

## 2. Performance Metrics (Web Vitals)
- **LCP**: Target < 2.5s.
- **CLS**: Target < 0.1.
- **FID**: Target < 100ms.

## 3. AI Reliability
Log latency and success rate of `generateProjectPlan` calls.
- **Critical Alert**: Success rate < 95% over 5-minute window.

## 4. Error Handling
Global `window.onerror` and `unhandledrejection` listeners to capture runtime failures in the Gemini SDK.