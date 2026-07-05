# Peer Stream Ship-Ready Upgrade Plan

## Goal
Make Peer Stream production-ready by replacing deprecated infrastructure, upgrading the stack, hardening contract/wallet/error handling, adding CI and tests, and defining a stable deployment path.

## Current state
- Legacy CRA v3 React app in `packages/react-app`
- Outdated Web3 stack: `ethers@4`, `apollo-client@2`, `3box`, `peerjs`
- No CI config before this update
- Minimal tests (`App.test.js` only)
- Hardcoded RPC keys and static testnet addresses
- Deprecated third-party infrastructure dependencies

## Priority roadmap

### 1. Replace deprecated infrastructure
- Replace `3box` with a maintained alternative
  - Ceramic/IDX or self-hosted backend + encrypted storage
  - Or wallet-based profile/chat system
- Replace `peerjs` video/chat with a robust signalling layer
  - Managed service (LiveKit, Daily, Twilio) or self-hosted WebRTC server
- Remove reliance on Heroku-hosted signaling service and deprecated testnets

### 2. Upgrade the stack
- Move React to v18+ and upgrade to modern front-end tooling
  - Prefer Vite or Next.js over CRA
- Upgrade `react-router-dom` to v6
- Upgrade `ethers` to v6, or migrate to `viem`
- Upgrade GraphQL client to `@apollo/client` v3+ or replace with modern fetch-based client
- Replace legacy Redux/Thunk if not needed
- Migrate from `crypto-js` / `3box` style dependencies to modern wallet-based auth patterns

### 3. Harden contract/wallet/error handling
- Move all RPC URLs and API keys into environment variables
- Add contract operation validation and user-facing failures
- Replace `fromBlock = 0` event queries with indexed pagination or subgraph queries
- Validate all external URLs and profile values before rendering
- Remove `window.confirm` / `alert` flows
- Add centralized async error handling for wallet connect / contract calls / media access
- Use explicit gas estimation and margin calculations with new Web3 library APIs

### 4. Add CI and tests
- CI pipeline created under `.github/workflows/ci.yml`
- Add unit tests for:
  - `src/utils` helpers
  - `src/hooks` contract and wallet logic
  - components with Web3 / modal state behavior
- Add integration tests for wallet connect and stream workflows
- Add end-to-end tests with Cypress or Playwright for key user flows
- Add dependency audit and vulnerability scanning,
- Add linting across the React codebase

### 5. Define a stable deployment path
- Choose a production host:
  - Frontend: Vercel / Netlify / Cloudflare Pages
  - Signaling / backend: managed service or self-hosted serverless
- Use env-based configuration:
  - `REACT_APP_RPC_URL_MAINNET`
  - `REACT_APP_RPC_URL_GOERLI`
  - `REACT_APP_SUBGRAPH_URL`
  - `REACT_APP_VIDEO_SIGNALING_URL`
- Possibly split out a backend package for secure API and WebRTC signaling
- Add deployment docs to `README.md` and `packages/react-app/README.md`

## Prioritized implementation checklist

1. `packages/react-app/package.json`
   - Add `test:ci`, `lint`, `build` scripts
   - Keep `dev` locally while moving toward Vite/Next.js later
2. Add CI workflow
   - `.github/workflows/ci.yml`
   - Install dependencies, run lint, tests, build
3. Replace hardcoded network configuration with env vars
4. Replace `3box` and `peerjs` dependencies in a phased refactor
5. Upgrade React and Web3 dependencies
6. Add unit and integration tests
7. Add deployment environment documentation

## Short-term ship improvements
- Keep the current app running while introducing a modern stack in parallel
- Document supported chains and wallet providers clearly
- Harden every Web3 interaction path with try/catch and user messaging
- Create a stable CI baseline before code rewrites

## Next step
- I can now produce a detailed implementation plan with specific file changes, dependency versions, and a migration sequence for this repo.
