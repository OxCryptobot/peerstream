# Gstack Modernization Plan for Peer Stream

This repo will be modernized under a Gstack-style workflow in five phases:

## 1. Audit and baseline
- Confirm current architecture and dependency health.
- Ensure workspace scripts are CI-ready.
- Add a baseline CI workflow to run lint, tests, and production build.
- Create a ship-ready modernization plan document.

Current status:
- Added `npm run lint`, `npm run test:ci`, and build scripts.
- Added `.github/workflows/ci.yml`.
- Added `SHIP_READY_PLAN.md`.

## 2. Upgrade the core stack
- Migrate React from `16.12.0` to `18.x`.
- Replace CRA v3 with a modern bundler (Vite or Next.js).
- Move `react-router-dom` to `v6`.
- Replace `redux@3.7.2` with either React Context or modern Redux Toolkit only if needed.
- Upgrade `styled-components`, `react-spring`, `react-select`, and similar UI libraries.
- Migrate `ethers@4` to `ethers@6` or `viem`.
- Upgrade GraphQL client to `@apollo/client@3+` or replace with fetch-based GraphQL.
- Update linting to ESLint v8+ and replace Flow plugins with TypeScript or proper JS rules.

## 3. Replace deprecated infrastructure
- Remove `3box` and `3box-chatbox-react`.
- Replace peer discovery and chat with a maintained identity/message solution.
  - Option A: wallet-based identity + backend API.
  - Option B: Ceramic/IDX with modern authenticated storage.
- Replace `peerjs` video chat with a stable alternative.
  - Option A: LiveKit or Daily for WebRTC.
  - Option B: self-hosted socket signalling + standard RTCPeerConnection.
- Remove hardcoded Infura key and unsupported testnet assumptions.
- Replace deprecated subgraph endpoint and `fromBlock=0` logs with query-based event retrieval.

## 4. Harden contract/wallet/error handling
- Add environment-driven RPC and endpoint configuration.
- Use explicit on-chain validation and user-friendly error messages.
- Add safe contract factory helpers and remove raw `string.split(...)` metadata parsing.
- Centralize wallet connection state and error recoveries.
- Replace `window.confirm` / `alert` flows in production UI.
- Add security checks for external links and profile metadata.
- Use type-safe contract interactions and modern gas estimation APIs.

## 5. Add CI, tests, and deployment
- Expand tests beyond `App.test.js`:
  - unit tests for `src/utils`, `src/hooks`, and core components.
  - integration tests for wallet connect and streaming flows.
  - E2E tests for discover/chat/stream/video experience.
- Add dependency audit and automated security checks.
- Add staging/build deployment docs.
- Choose production host and deployment pipeline:
  - frontend host: Vercel / Netlify / Cloudflare Pages.
  - signalling/backend: managed or serverless host.
- Document release flow in `README.md`.

## Implementation checkpoints
1. Baseline CI and scripts.
2. Clean dependency upgrade plan with `package.json` and `yarn.lock` updates.
3. Replace `3box` and `peerjs` in separate refactor branches.
4. Add meaningful tests before major refactor commits.
5. Validate on a staging deploy and run real browser QA.

## Gstack-specific outcome
- A repo that can be reviewed with `gstack review`/`gstack ship` style workflow.
- A modernized app with stable deployment artifacts.
- A documented path from prototype to ship-ready production.
