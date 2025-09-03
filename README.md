# ab-mint-onchain

Mint Art Blocks directly from the blockchain (no off‑chain APIs). Prototype static site designed for GitHub Pages hosting.

## Project layout

- `docs/`: Static site served by GitHub Pages
  - `index.html`: UI scaffold with wallet connect button
  - `styles.css`: Minimal styles (dark theme)
  - `app.js`: EIP‑1193 wallet integration, reactive account/chain handling
  - `.nojekyll`: Ensures Pages serves files as-is

## Local development

Because this is a static site, you can serve `docs/` with any HTTP server.

Option 1: Python 3

```bash
cd docs
python3 -m http.server 8080
```

Option 2: Node.js (http-server)

```bash
npx --yes http-server docs -p 8080 -c-1
```

Then open `http://localhost:8080` in a browser with an injected wallet (e.g., MetaMask). Use a test network like Sepolia for development.

## GitHub Pages deployment

This repo is configured to serve static content from the `docs/` directory:

1. Push changes to `main` (or your default branch)
2. In GitHub → Settings → Pages, set:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
3. Save. Your site will be available at `https://<your-username>.github.io/<repo-name>/`.

No build step is required.

## Current capabilities

- Detect injected EIP‑1193 provider
- Connect wallet via `eth_requestAccounts`
- Reactive UI updates on `accountsChanged`, `chainChanged`, `connect`, `disconnect`
- Display account, chain, and ETH balance (from wallet RPC)

## Next steps (TODO)

- Query Art Blocks core contracts directly to discover projects (read‑only)
- Implement minimal on‑chain mint function invocation
- Network awareness and validation (e.g., only show actions on supported networks)
- Basic error surfaces and user guidance

## Notes

This is experimental software. Always test on a testnet before using mainnet.
