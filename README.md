# Tank Wars

Phone-friendly, turn-based artillery for two players on separate devices. Plain HTML, canvas and JavaScript served by a Cloudflare Worker. A D1 database synchronizes invite rooms. No external JavaScript or artwork dependencies.

Create a room, share its code or invite URL, and have the second player join on their phone. Adjust angle and power; alternate shots until one tank loses its armor. Wind affects trajectories, near misses destroy terrain, and both players can request a rematch. Solo practice uses the same rules with a bot. Refreshing restores a seat from browser storage. Rooms expire after 24 hours.

Production hosting uses Sites instead of Sudoku's static GitHub Pages hosting because the game needs shared state. The Site begins private. Grant the opponent access or make it public through Site access settings before inviting another account.

## Development

Requires Node 24 for the SQLite-based preview and tests. No dependencies to install.

- `npm run dev`: local preview, with a disposable in-memory database.
- `npm test`: server rules, player authorization, concurrent shots, rematches and browser script syntax.
- `npm run build && npm run validate`: build and validate the deployment.

Source lives in `worker/index.js`; `dist/` is generated. Database migration is in `drizzle/`. The server is authoritative and uses version-checked writes to reject duplicate or stale actions. Room codes grant access to an unclaimed second seat; a random private token authorizes each player's subsequent actions. Do not share your browser's saved seat token. The game is intended for friendly play, with no ranked matchmaking or anti-bot system.
