# DC Internet Listener Web App Implementation Guide

## Goals
- Ship a usable web experience (map-first, drill-down detail) that matches the documented architecture.
- Keep the stack simple: React + Vite on the client, REST/JSON APIs from the backend described in `dc_internet_listener.md`.
- Prioritize observability and freshness indicators so users can trust the data.

## Frontend Stack
- **Framework**: React 18 with Vite.
- **Language**: TypeScript.
- **State/query**: React Query for server state; Zustand (or Redux Toolkit) for client-only UI state.
- **Routing**: React Router v6.
- **UI kit**: Tailwind CSS (fast styling) plus Headless UI/Reach UI for accessibility.
- **Maps**: Mapbox GL JS (fallback: Leaflet) with ward GeoJSON overlay.
- **Charts**: Recharts or Chart.js for time-series and emotion breakdowns.
- **Build**: Vite + ESLint + Prettier; pnpm or npm scripts.
- **Testing**: Vitest + React Testing Library + Playwright smoke test for routing.

### Project Layout (frontend)
```
web/
  src/
    app/
      AppShell.tsx
      routes.tsx
      providers.tsx (React Query + Zustand contexts)
    components/
      map/
        WardMap.tsx
        WardChoroplethLayer.tsx
        WardTooltip.tsx
      charts/
        SentimentTrendChart.tsx
        EmotionRadar.tsx
        CategoryStackedBars.tsx
      cards/
        SignalCard.tsx
        EventCard.tsx
        WardMoodCard.tsx
      layout/
        TopNav.tsx
        GlobalFilterBar.tsx
        ToastCenter.tsx
    pages/
      WardMapPage.tsx        // route "/"
      WardDetailPage.tsx     // route "/ward/:wardId"
      EventsPage.tsx         // route "/events"
      EventDetailPage.tsx    // route "/event/:eventId"
      DailyPulsePage.tsx     // route "/daily"
      SourcesPage.tsx        // route "/sources"
      AlertsPage.tsx         // route "/alerts"
      SearchPage.tsx         // route "/search"
    api/
      client.ts              // axios/fetch wrapper
      wards.ts               // getWards(), getWardStatus()
      signals.ts             // getSignals(), getSignal(id)
      events.ts              // getEvents(), getEvent(id)
      sources.ts             // getSources(), getSource(id)
      alerts.ts              // getAlerts()
    state/
      filters.ts             // global filters store
      map.ts                 // viewport + layers
      drawers.ts             // signal/event drawers
    assets/wards.geojson
  package.json
  vite.config.ts
```

## Minimal API Contracts (REST/JSON)
Only the shapes needed by the web app; URLs are omitted by design.

- **GET wards** → `[{ id, name, centroid }]`
- **GET ward-status?timeWindow=24h** → `[{ wardId, color, score, freshness }]`
- **GET signals** (filters: timeWindow, wards[], categories[], sourceTypes[], topics[], text, onlyGeocoded, hideDuplicates) →
  `[{ id, title, body, category, sentiment, emotions, wardId, platform, sourceName, tags, location, placeText, timestamp }]`
- **GET signals/:id** → detailed signal with entities/themes/related cluster.
- **GET events** (filters: date range, ward, type, recurring) → `[{ id, title, startTime, endTime, wardId, location, recurrence, tags, impact }]`
- **GET events/:id** → event detail + sentiment timeline buckets: `{ before: {positive, neutral, negative}, during: {...}, after: {...} }`.
- **GET daily-summary?date=YYYY-MM-DD** → citywide + per-ward mood/theme deltas.
- **GET sources** → registry with health/freshness.
- **GET alerts** → yellow/red stream with severity + affected wards.

## Data Flow
1. User sets filters in `GlobalFilterBar` → stored in `filters` store.
2. Routes subscribe to filters and call corresponding API hooks (React Query).
3. Map and tables render from the ward status and signals queries; stale data shows freshness banners.
4. Clicking a ward updates the router and preserves filter params for deep links.

## UX Notes (web-first)
- **Map-first entry**: Load ward choropleth quickly with skeletons; keep signals lazy-loaded.
- **Context drawer**: Clicking a signal/event opens a right drawer, not a full page takeover.
- **Error states**: inline banners per widget with retry; keep map usable even if signals fail.
- **Performance**: paginate/lazy-load signal feeds; debounce search; cache filters in localStorage.
- **Accessibility**: keyboard nav for map list/table, focus traps in drawers, colorblind-safe palette.

## Quickstart Scripts (to add in `web/package.json`)
- `dev`: `vite`
- `build`: `vite build`
- `preview`: `vite preview`
- `lint`: `eslint "src/**/*.{ts,tsx}"`
- `test`: `vitest`
- `e2e`: `playwright test`

## Next Steps to Ship the Web App
1. Scaffold `web` with `npm create vite@latest web -- --template react-ts` and install Tailwind + React Router + React Query + Zustand + Recharts + Mapbox GL.
2. Add ward GeoJSON asset and Mapbox style token via env.
3. Implement `GlobalFilterBar`, `WardMapPage`, and `WardDetailPage` with mocked API clients to validate UX.
4. Connect real API endpoints as they come online; gate with feature flags.
5. Add tests: unit (Vitest), component (React Testing Library), and one Playwright smoke test that navigates `/` → `/ward/1` → `/daily`.
6. Set up CI (lint + test) and deploy static assets to a CDN (e.g., Vercel/Netlify); point API base URL via env.

## Deployment Considerations
- Use environment variables for API base URLs and Mapbox tokens.
- Enable HTTPS and CSP; restrict map tile origins.
- Add Sentry (or similar) for frontend error tracking and performance.
- Cache control: short TTL for ward status/alerts; longer for static assets.

## Observability Hooks
- Log client-side API errors with correlation IDs returned by the backend.
- Surface last-fetch timestamps on ward cards and lists.
- Expose a small `/health` JSON widget in the UI to mirror backend health checks.

## Minimal Visual Style Guide
- Primary palette ties to categories: Red (#d32f2f), Yellow (#f9a825), Green (#2e7d32), Blue (#1976d2), Pink (#c2185b).
- Use neutral grays for containers; keep high contrast for accessibility.
- Status chips with icons: Red (alert), Yellow (warning), Green (check), Blue (gift), Pink (heart/comment).

This guide grounds the existing architecture in a concrete web implementation plan so the next task can start with `npm create vite@latest` and a clear component/API contract.
