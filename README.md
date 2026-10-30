# Tank Wars

Phone-friendly, turn-based artillery for two players on separate devices. Plain HTML, canvas and JavaScript served by a Cloudflare Worker. A D1 database synchronizes invite rooms. No external JavaScript or artwork dependencies.

Create a room, share its code or invite URL, and have the second player join on their phone. Adjust angle and power; alternate shots until one tank loses its armor. Wind affects trajectories, near misses destroy terrain, and both players can request a rematch. Solo practice uses the same rules with a bot. Refreshing restores a seat from browser storage. Rooms expire after 24 hours.

The GitHub Pages app hosts solo practice and links online room creation/joining to the multiplayer Sites backend, which supplies shared match state. The Site begins private. Grant the opponent access or make it public through Site access settings before inviting another account.

## Development

Requires Node 24 for the SQLite-based preview and tests. No dependencies to install.

- `npm run dev`: local preview, with a disposable in-memory database.
- `npm test`: server rules, player authorization, concurrent shots, rematches and browser script syntax.
- `npm run build && npm run validate`: build and validate the deployment.

Source lives in `worker/index.js`; `dist/` is generated. Database migration is in `drizzle/`. The server is authoritative and uses version-checked writes to reject duplicate or stale actions. Room codes grant access to an unclaimed second seat; a random private token authorizes each player's subsequent actions. Do not share your browser's saved seat token. The game is intended for friendly play, with no ranked matchmaking or anti-bot system.

## GitHub Pages deployment

The `Deploy to GitHub Pages` workflow runs tests, builds a static game from the shared source, and publishes on every push to `main`. There are no dependencies to install.

In **Settings → Pages**, select **GitHub Actions** as the source. Run the workflow manually after first enabling Pages, or push a commit. The expected URL is https://jenschristianschroder.github.io/Tank-Wars/ .

`npm run build:pages` writes `pages/index.html` and `.nojekyll`. Solo practice runs directly on Pages. Online duel and Join open https://tank-wars.ambersage512.chatgpt.site/ with any room code preserved. The multiplayer site currently requires owner-granted access; publishing the Pages app does not make that backend public. Backend changes still need a separate Sites deployment.
