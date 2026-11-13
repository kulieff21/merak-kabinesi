# Architecture and maintenance

## Runtime

The museum is a static application using browser-native ES modules. It has no package dependencies, backend, analytics, external font requests, accounts or required API keys. A static HTTP server is required because browsers apply origin rules to ES modules; opening `index.html` directly as a local file is not supported.

| Location | Responsibility |
| --- | --- |
| `index.html` | Semantic document shell, navigation, no-script explanation, native diagram dialog |
| `styles.css` | Layout, material palette, responsive rules, reduced motion and print styles |
| `src/collection.js` | Locale-aware collection facade with stable exhibit and category IDs |
| `src/locales/collection.en.js`, `collection.tr.js` | Complete exhibit narratives, citations, source-access notes and curated routes |
| `src/i18n.js`, `src/locales/ui.tr.js` | English source messages, Turkish translations, interpolation and language preference |
| `src/routes.js` | English canonical slugs and backwards-compatible Turkish route aliases |
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

The local storage key `merak-kabinesi.v1` contains arrays of visited and saved exhibit IDs. Invalid, duplicate and unknown values are discarded. The original IDs remain stable across both languages so existing notebooks are preserved. Export produces a visitor-initiated JSON file with localized object titles, language and canonical links; nothing is transmitted to a server.

The separate key `cabinet-language.v1` stores `en` or `tr`. A valid `?lang=` query takes priority over the saved preference; without either, English is the default regardless of the browser language. Switching languages updates the document language, titles, metadata, accessible labels, collection and mechanisms while preserving the route and notebook. Each mechanism is cleaned up and mounted again, so an active animation or audio context is closed. Storage failure falls back to an in-memory session.

New links use routes such as `#/exhibit/acoustic-mirror?tour=unseen`, `#/collection`, `#/tours`, `#/notebook`, `#/sources` and `#/about`. Earlier `#/eser/ses-aynalari?rota=gorunmeyen` links and other Turkish route aliases still resolve to the same stored IDs. The language query belongs before the hash: `?lang=tr#/exhibit/acoustic-mirror`.

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
node scripts/browser-qa.mjs --language=tr
```

The browser checker launches a disposable, isolated installed Chrome/Chromium process through native CDP. Set `CHROME_PATH` if the executable is not at one of the script's standard locations. It uses the project's ignored `.local/` directory for its profile, downloads, screenshots and report, and removes only its own temporary profile. It does not inspect the user's existing browser sessions.

`--smoke` checks all nine exhibit routes at desktop and mobile sizes. `--narrow` checks all nine at 320 CSS pixels. The full run also exercises controls, drawing and notebook downloads, audio graph lifecycle, keyboard actions, filters, tours, language switching, preference persistence, explicit-language links and the bilingual recovery page. Reports go to `.local/qa-en/` or `.local/qa-tr/`. `QA_URL` can point the checker at a compatible deployment.

The GitHub workflow runs the pure tests and static build on pushes to `main`, using pinned official GitHub actions and Node.js 22. Browser QA remains a local check because it depends on an installed browser and visual review.

## Hosting

`npm run build` recreates `dist/` from a fixed allowlist: the HTML entry points, CSS, ES modules, assets and `.nojekyll`. It excludes repository metadata, tests, documentation, local state and QA profiles. `.openai/hosting.json` declares the static output directory for Sites. The same source works at the GitHub Pages project subpath because asset references are relative and routes live after `#`.

No client-side environment variable or deployment secret is required.
