# Validation record

Date: 13 November 2026. Environment: Windows, Node.js 22.23.2, installed headless Chrome. No package or browser installation was required.

## Pure and content checks

`npm test`: **29 passed, 0 failed**.

The suite checks parabolic focal intersection and unit reflected directions, off-axis change, capsule units and friction threshold, load/time scaling and arrival clamping, the 19-year calendar endpoint, oscillator geometry and damping, thin-lens distances and ray convergence, zoetrope quantization, audio frequency limits, non-mutating card repetition, source integrity, complete exhibit records, related links, route coverage, Turkish search, malformed state and malformed routes.

Localization checks cover the English first-visit default, URL and preference priority, blocked storage, complete narratives and stable source/object identities in both editions, exact interpolation-placeholder parity, locale-specific number formatting, canonical/legacy route equivalence, existing notebooks and translation coverage for literal UI messages and shell attributes.

`npm run build`: successful. Its explicit allowlist produces a self-contained `dist/` site with no tests, Git data, local notebook, browser profile or QA evidence inside the deployable output.

## Browser checks

`node scripts/browser-qa.mjs`: **66 checks passed in English**; `--language=tr`: **66 passed in Turkish**. Dedicated `--narrow` runs added **11 checks in each language**. No page exceptions, console errors, HTTP errors or third-party requests were observed in these runs.

| Viewport | Coverage |
| --- | --- |
| 1440 × 1000 | Collection and all nine exhibit pages; all nine mechanisms exercised |
| 390 × 844, mobile emulation | Collection and all nine exhibit pages; all nine mechanisms exercised |
| 320 × 700, mobile emulation | Home plus acoustic mirror, Jacquard, theremin and lantern |
| 800 × 900 | Home and the same four representative detail layouts |
| 1280 × 720 | Home and the same four representative detail layouts |
| 320 CSS pixels, dedicated narrow runs | Home and all nine exhibit pages; 11 additional layout/smoke checks per language |

Every checked page had the requested viewport width, one main heading and no horizontal document overflow. Narrow-screen verification also caught an English related-object title expanding its grid column. The column now permits text wrapping within the available space.

The full run verifies:

- Search with ASCII equivalents of Turkish letters, all category counts, no-result recovery.
- Saving a specimen, persistence after a reload, the notebook page and a real JSON download.
- Off-axis reflection and a native enlarged-diagram dialog, including Escape dismissal.
- Scan progression, actual Canvas change, pause stability and resolution selection.
- Capsule stalling below the force threshold, load changes and stepping.
- Calendar endpoints, including 19 years → 235 months.
- Card editing, arrow-key movement between cells, a woven row and a preset.
- Audio opt-in, pitch change, actual Web Audio nodes and closure when the worktable leaves view.
- Oscillator redraw and a downloaded SVG containing path data and the chosen parameters.
- Zoetrope frame rate and shutter-state change.
- Both 120 mm → 240 mm and 90 mm → 720 mm lantern focus examples.
- All stops of a curated route, invalid-link recovery, reduced-motion startup, sources and about pages.
- Switching languages without losing the route or saved notebook; persistence after reload; explicit-language links overriding a saved preference.
- The bilingual static recovery page, its language switch and the correct home path.

## Visual review

Reviewed the English desktop and mobile cabinet, translated worktables and enlarged diagrams. Original English PNG screenshots are retained under `docs/screenshots/`. The local, ignored `.local/qa-en/` and `.local/qa-tr/` folders retain route screenshots, exported samples and machine-readable reports.

These checks establish the exercised browser behavior, selected mathematical properties and responsive layouts. They do not establish reconstruction accuracy, browser compatibility beyond the tested engine, or a complete assistive-technology certification. The source book and each worktable disclose the scientific and historical scope of its model.
