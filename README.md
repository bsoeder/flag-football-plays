# 5-on-5 Flag Football Play Visualizer

# This is a flag football visualizer that allows basic generation of plays for export from 
# the bunch, pro and trips formations.  This is based on the Spring 26 Seattle Seahawks from 323 Youth football

## Playbook library

Open the **Playbooks** tab for the full-width Playbook Library. Use the **Browse by**
toggle to organize the base install **by formation** (Bunch / Pro / Trips) or **by play
type** (Quick Game, Dropback Pass, Shot Play, Run, Play Action, Option / RPO). Each card
shows a live diagram, the four-digit code, and the layered concepts; tap **Open in Studio**
to load it onto the field board. Your own saved playbooks still live alongside the library.

## Installing on an iPad

There are two ways to get the app onto an iPad.

### Option A — Add to Home Screen (no Mac or developer account needed)

The web app is a PWA. Host this folder on any static web server (or push it to
GitHub Pages), then on the iPad:

1. Open the hosted URL in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Launch it from the home screen — it opens full-screen with its own icon and works
   offline thanks to the bundled service worker.

The `manifest.webmanifest`, PNG app icons (`apple-touch-icon.png`, `icon-192.png`,
`icon-512.png`), and `sw.js` make the install look and behave like a native app.

### Option B — Native Xcode wrapper

An iPad-ready Xcode wrapper lives in `ios-ipad/FlagFootballPlaysPad.xcodeproj`.

1. Open `ios-ipad/FlagFootballPlaysPad.xcodeproj` in Xcode.
2. Select the `FlagFootballPlaysPad` target → **Signing & Capabilities**.
3. Set your **Team** and a unique **bundle identifier** (Xcode uses automatic signing).
4. Choose an iPad simulator or a connected iPad.
5. Build and run. On a personal (free) team, trust the developer profile on the iPad
   under **Settings → General → VPN & Device Management** the first time.

The native shell bundles the existing `index.html`, `app.js`, `styles.css`, and the web
icons directly from this repo, so changes to the web app stay the source of truth for the
iPad version too.
