# Merak Kabinesi

A Turkish-language, browser-based cabinet of historical technological curiosities.

## Working agreement

- Keep application copy and exhibit narratives in Turkish. Write code identifiers, commits, and repository documentation in English.
- Use browser-native HTML, CSS, SVG, Canvas, and Web Audio. No runtime framework or package installation is needed.
- Prefer original vector illustrations to reproducing museum images. Record the licenses of bundled third-party assets.
- Verify historical claims against museum, heritage, original research, or other primary sources. Each exhibit must link its sources and distinguish evidence from interpretation.
- Label educational models and disclose their assumptions. Never present illustrative values as measured properties of the historical object.
- Support keyboard navigation, touch controls, reduced motion, direct hash links, and browser Back.
- Scope all work to this project. Keep temporary browser profiles and QA evidence on D:.
- Use only Elmar's GitHub identity. Do not add collaborators, co-author trailers, bot-authored commits, or external services requiring credentials.
- Commit completed, coherent steps and push to the authorized public repository `kulieff21/merak-kabinesi`.

## Commands

- `npm run dev`: local static server.
- `npm test`: content integrity, mathematics, and static integration checks.
- `npm run build`: prepare a deterministic, standalone `dist/` deployment.

The site must remain usable without third-party network requests. Audio starts only after an explicit user gesture.
