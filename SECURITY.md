# Security Policy

## API Key Safety
- The Gemini `API_KEY` is injected via `process.env`. 
- **Critical**: Do not hardcode the key or commit `.env` files.

## Content Security Policy (CSP)
Recommended headers for production:
```text
default-src 'self';
script-src 'self' 'unsafe-inline' cdn.tailwindcss.com esm.sh;
connect-src 'self' generativelanguage.googleapis.com esm.sh;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: cdn-icons-png.flaticon.com;
```

## Data Privacy
- Project data is stored strictly in the user's browser via `localStorage`.
- No telemetry is collected by default.