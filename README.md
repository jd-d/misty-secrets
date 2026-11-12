# Misty Secrets

A static flavour recipe lab, mixing calculator and tasting journal.

## Live sites

- GitHub Pages: https://jd-d.github.io/misty-secrets/
- Original site: https://misty-secrets.tangy-scarf-6669.chatgpt.site

## Development and deployment

The complete website lives in `dist/`. It uses plain HTML, CSS and JavaScript, with locally hosted artwork. There is no package installation or compilation step.

Pushes to `main` run the calculator checks, then publish `dist/` to the root of the `gh-pages` branch.

Each pull request from this repository is also published as a preview at `https://jd-d.github.io/misty-secrets/previews/pr-<number>/`. A bot comment on the PR links to it and is updated on every push. The preview is removed when the PR is merged or closed. Pull requests from forks are validated but not previewed, because their code must not run with a write token.

One-time setup: after the first deployment to `main` creates the `gh-pages` branch, set **Settings > Pages > Source > Deploy from a branch > `gh-pages` / (root)**.

Run the checks with Node.js:

```sh
node check-calculator.cjs
node check-balance.cjs
node check-strengths.cjs
```

For a local preview, run `python3 -m http.server 8000 --directory dist` and open http://localhost:8000/.

## Browser data

Saved recipes, inventory choices and tasting notes stay in your browser. They are not stored in this repository. The original host and GitHub Pages have separate browser storage. Use **Export my notebook** on the original site, then **Import backup** on GitHub Pages to transfer that data. Theme and unit preferences may need to be selected again.

## Mirror provenance

Initially copied from the deployed Misty Secrets site, version 15, source commit `20d612a54f09d8bdbe6a0eda049ed008ef035730`.

This is an independent copy. Changes made to the original Sites deployment do not automatically sync here, and changes here do not automatically update the original host.

PR preview publishing follows the approach in `jd-d/website-template-include-ALL-branches`, adapted to use the `pull_request` event, a single updating PR comment and a deployment check against the exact commit.
