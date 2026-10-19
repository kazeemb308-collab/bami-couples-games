# Touchline FM

A mobile-first, browser-based football management career game. This app lives in its own folder so it can be deployed as a separate Vercel project without changing the existing Couples Games site.

## Features in this first playable build

- Career creation with real-club-inspired choices or a custom club
- Multi-season career loop with player ageing and development
- Squad view, player training, formation selection, mentality and playing style
- Transfer market with budget checks and signings
- Home-and-away league fixtures, league table, simulated rival results
- Match-day 2D animated pitch, live commentary, score updates and full-time result
- Autosaved career in browser local storage, plus JSON export/import backups

## Deploy as a separate Vercel website

Create a **new Vercel project** linked to this repository and set **Root Directory** to `football-manager`. The project is a static HTML app; no build command or environment variables are required. Keep the existing project/root directory unchanged.

## Notes

- Career saves are local to the browser/device and do not sync between devices.
- Club/player names and ratings are game data for this fan-made simulation; match results are simulated.
