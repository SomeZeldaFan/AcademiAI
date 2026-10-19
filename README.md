# AcademiAI

Three short modules on using AI for university study and research. Built with React, TypeScript and Vite; hosted as static files.

## Open the finished website

Double-click **START ACADEMIAI.cmd**. It starts a local server and opens the website in your browser. Keep its window open during the presentation. Press Ctrl+C in that window when finished.

The launcher uses Node.js already available on this computer. The finished `dist` folder includes the fonts, medal images, mathematical rendering and application code. Presenting the local build requires no internet connection. External references require internet access.

Do not open `dist/index.html` directly: browsers restrict JavaScript module loading from file URLs.

## Develop

Use Node.js 24 LTS and pnpm 11.25.0. From this folder:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173/. The isolated component preview is http://127.0.0.1:5173/#/preview and is available only in development. It has separate temporary state.

```sh
pnpm test
pnpm build
```

After changing source files, build again before opening the launcher.

## Files

- `src/data/modules.ts`: lesson text, worked examples, five questions and answer keys for each module.
- `src/data/sources.ts`: numbered references and further reading.
- `src/logic.ts`: answer checking, scoring, unlocking and session persistence.
- `src/App.tsx`: page flows and shared quiz controller.
- `src/ui.tsx`: reusable controls, mathematical text, medals and the monogram.
- `src/styles.css`: shared design and feedback states.
- `public/assets/`: three optimised medal images.
- `design/`: approved visual references, logo options and original image assets.
- `tests/journey.test.ts`: scoring, persistence and content checks.
- `docs/`: frozen specification, testing record and asset notes.

## GitHub Pages

Repository: [SomeZeldaFan/AcademiAI](https://github.com/SomeZeldaFan/AcademiAI)

Site address: [AcademiAI](https://somezeldafan.github.io/AcademiAI/)

Pages uses **GitHub Actions** as its publishing source. Pushing to `main` runs **Test and deploy AcademiAI**: it installs the pinned dependencies, tests the quizzes, builds the static site and deploys the result. The workflow can also be started from the repository's Actions tab. A successful deployment appears there with its website link.

After editing the source, run `pnpm check`, commit the changes and push `main`. The app uses relative asset paths and hash navigation, so refreshing a lesson works under the repository URL. No domain name or paid hosting is required.

Original design images, screenshots and local testing notes remain in the Desktop copy and are excluded from the public repository.

The deployment workflow follows [Vite's GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages).

## Progress

Pass four of five questions to unlock the next module. Matching requires all three pairs for its one point. Retakes preserve the best score and earned medal. Completed results and medal-animation history are saved in the current tab's `sessionStorage`; unfinished quizzes exist only in memory.

A refresh discards an unfinished quiz and returns to its lesson. Browser tab duplication or session restoration may copy/restore `sessionStorage`, as defined by the browser. There are no accounts, live AI connections or server-side learner records.

## Editing content

Keep the two single-choice, two compare-and-choose and one three-pair matching structure. Option IDs are stable identifiers, not display letters. Each module supplies content only; it must not contain styling or behaviour code. Refer to `docs/SPECIFICATION.md` for the agreed rules.
