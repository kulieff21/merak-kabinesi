# Architecture and maintenance

## Runtime

The museum is a static application using browser-native ES modules. It has no package dependencies, backend, analytics, external font requests, accounts or required API keys. A static HTTP server is required because browsers apply origin rules to ES modules; opening `index.html` directly as a local file is not supported.

| Location | Responsibility |
| --- | --- |
| `index.html` | Semantic document shell, navigation, no-script explanation, native diagram dialog |
| `styles.css` | Layout, material palette, responsive rules, reduced motion and print styles |
| `src/collection.js` | Turkish exhibit copy, claim citations, source-access notes, routes and related exhibits |
| `src/illustrations.js` | Original, self-contained specimen SVGs and the linked cabinet |
| `src/app.js` | Hash routing, collection search, notebook, source book and diagram snapshots |
| `src/math.js` | Pure educational model calculations |
| `src/state.js` | Defensive notebook parsing, Turkish search normalization and route parsing |
| `src/demos/` | One independent implementation for each of the nine mechanisms |
| `scripts/` | Static preview, deterministic packaging, font acquisition and native browser QA |
| `tests/` | Model invariants, content relationships, source integrity and state failure handling |

## Interaction lifecycle

Each demo returns a cleanup function. Navigation cancels its animation, disconnects observers, aborts event listeners and closes any audio context. Animated demos run only after an explicit action, at a maximum draw rate of 30 fps. They pause when the page is hidden or their worktable leaves the viewport. Opening a diagram snapshot also pauses the demo.

Theremin audio is opt-in and uses a quiet, gain-limited sine oscillator. The visual example explains the difference between two radio frequencies; Web Audio synthesizes the calculated audible frequency directly. It does not simulate an RF mixer or measure antenna capacitance. It closes when the exhibit is left, the tab is hidden or the worktable leaves view.

The diagram dialog shows a snapshot, not a second simulation. It can be closed with its button, Escape or the backdrop. Its scrollable image supports close inspection on narrow screens.

## Local state

The only persisted application state is the local storage key `merak-kabinesi.v1`, containing arrays of visited and saved exhibit IDs. Invalid, duplicate and unknown values are discarded. Storage failure falls back to an in-memory session. Export produces a visitor-initiated JSON file; nothing is transmitted to a server.

## Reproducing verification

Use Node.js 22 or later. Dependency installation is unnecessary.

```sh
npm test
npm run build
npm run dev
```

While the preview server is running, use a second terminal:

```sh
node scripts/browser-qa.mjs
```

The browser checker launches a disposable, isolated installed Chrome/Chromium process through native CDP. Set `CHROME_PATH` if the executable is not at one of the script's standard locations. It uses the project's ignored `.local/` directory for its profile, downloads, screenshots and report, and removes only its own temporary profile. It does not inspect the user's existing browser sessions.

`--smoke` checks all nine exhibit routes at desktop and mobile sizes. The full run also exercises controls, drawing and notebook downloads, audio graph lifecycle, keyboard actions, filters, tours, persistence and error recovery. `QA_URL` can point the checker at a compatible deployment.

The GitHub workflow runs the pure tests and static build on pushes to `main`, using pinned official GitHub actions and Node.js 22. Browser QA remains a local check because it depends on an installed browser and visual review.

## Hosting

`npm run build` recreates `dist/` from a fixed allowlist: the HTML entry points, CSS, ES modules, assets and `.nojekyll`. It excludes repository metadata, tests, documentation, local state and QA profiles. `.openai/hosting.json` declares the static output directory for Sites. The same source works at the GitHub Pages project subpath because asset references are relative and routes live after `#`.

No client-side environment variable or deployment secret is required.
