# Tank Wars

A self-contained, turn-based artillery game in a single `index.html`. Hosted on GitHub Pages. No accounts, database, signaling service, multiplayer website, JavaScript libraries, or external assets.

## Play

- **Two phones:** Host selects **Create invite** and sends the TW1 code to their friend through their usual messaging app. The friend selects **Join a friend**, pastes that invite, chooses **Create reply**, and sends the reply back. The host pastes the reply and chooses **Connect phones**. Keep both tabs open. WebRTC sends game messages directly between browsers.
- **Pass & play:** Two players alternate on one phone. No network required after loading.
- **Practice solo:** Play against a bot. No network required after loading.

The tanks stay still. Players take turns choosing angle and power, with no timer. Every shot uses a smooth three-second animation and a gentle impact fade. The next turn waits for the animation to finish on both phones. Reduced-motion preferences hide the moving projectile. Switching tabs pauses the animation rather than fast-forwarding it when you return.

## Connections and limitations

**Internet assist is off by default.** In that mode there are no connection servers. Try both phones on the same Wi-Fi or hotspot. Browser and network restrictions may still prevent a direct connection, including some local connections.

To try different networks, both players can enable **Internet assist** before pairing. This uses Google's public STUN service (`stun:stun.l.google.com:19302`) to discover network addresses. It is not a multiplayer backend: no game state or shots are sent to STUN. No TURN relay is provided, so connections through restrictive NATs, firewalls, guest Wi-Fi or mobile networks may fail. There is no guarantee of internet play without a relay. Use the same network or Pass & play if direct pairing fails.

Codes include connection details and should only be shared with your opponent. The host browser owns the match and validates turn order, shot ranges and revisions. This is for friendly play, not cheat-resistant ranked competition. Closing or refreshing either tab ends the connection. Re-pairing starts a fresh match; there is no cloud save or automatic session recovery. No camera or microphone permissions are needed.

## GitHub Pages

https://jenschristianschroder.github.io/Tank-Wars/

In **Settings → Pages**, select **GitHub Actions** as the source. `.github/workflows/pages.yml` runs the tests, copies the self-contained page and publishes every push to `main`. After first enabling Pages, rerun the workflow or push a commit. The earlier Sites-hosted backend is no longer used by this application.

## Development

No dependencies to install. Use a modern browser with WebRTC data channel support. Node 24 is used by CI.

- `npm run dev`: static local server (localhost is suitable for local testing; use HTTPS for testing WebRTC on other devices).
- `npm test`: shared rules, malformed input, pairing, duplicate actions, two-peer synchronization and turn/animation gating.
- `npm run build:pages`: copy `index.html` into `pages/` with `.nojekyll`.
- `npm run validate`: check built scripts and self-contained output.

All runtime code and artwork are inline in `index.html`. Tests extract its inline scripts, so they exercise the same code that runs on phones. Downloading that one file preserves the local game; direct WebRTC behavior from a `file:` URL depends on the browser. GitHub Pages over HTTPS is recommended for two-phone play.
