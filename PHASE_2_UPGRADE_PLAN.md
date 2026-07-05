# Phase 2: Upgrade the Core Stack - Detailed Implementation Plan

## Overview
Replace the deprecated CRA v3 → modern bundler, React 16.12 → 18.x, and core dependencies.

## Key Upgrade Targets (with specific versions)

### 1. React & DOM
- **Current:** `react@16.12.0`, `react-dom@16.12.0`
- **Target:** `react@18.3.1`, `react-dom@18.3.1`
- **Breaking changes:** 
  - Automatic batching (mostly transparent)
  - Stricter StrictMode checks
  - `ReactDOM.render()` → `ReactDOM.createRoot()`
  - If using Suspense, may need error boundaries

### 2. Build Tool: Replace CRA with Vite
- **Current:** `react-scripts@3.3.1` (CRA v3 - archived)
- **Target:** Vite 5.x
- **Benefits:** 
  - ~10x faster dev server start
  - Native ESM development
  - Production optimizations (tree-shaking, code-splitting)
- **New packages:**
  - `vite@5.0.10`
  - `@vitejs/plugin-react@4.2.1` (includes React Fast Refresh)
  - `typescript@5.3.3`
  - Optional: `@vite/plugin-legacy@5.0.0` for older browser support

### 3. React Router
- **Current:** `react-router-dom@5.1.2`
- **Target:** `react-router-dom@6.20.0`
- **Breaking changes:**
  - `<Switch>` → `<Routes>`
  - Route params passed via `useParams()`
  - `<Redirect>` → `<Navigate>`
  - Remove `exact` attribute
  - Link `to` must be string/object, not render prop

### 4. Ethers.js
- **Current:** `ethers@4.0.43` (unmaintained)
- **Target:** `ethers@6.10.0`
- **Or alternative:** `viem@2.0.0` (lighter, better TS support)
- **Breaking changes:**
  - Provider initialization: `ethers.getDefaultProvider()` → new ethers.JsonRpcProvider()
  - Signer API completely redesigned
  - BigNumber → native BigInt
  - Contract interactions use `contract.function()` not `.functions.function()`
  - Error handling changed

### 5. Apollo GraphQL
- **Current:** `apollo-client@2.6.8`, `apollo-boost@0.4.7`, `@apollo/react-hooks@3.1.3`
- **Target:** `@apollo/client@3.8.0`
- **Breaking changes:**
  - Combine apollo-client, apollo-boost, and hooks into single package
  - Update queries and mutations to use new `useQuery`, `useMutation`
  - Cache normalization slightly different

### 6. State Management
- **Current:** `redux@3.7.2`, `redux-thunk@2.2.0`, `react-redux@7.1.0`
- **Assessment:** Only used if app needs complex state management
- **Option A (Recommended):** Remove entirely, use React Context + hooks
- **Option B:** Upgrade to `redux@4.2.1`, `react-redux@8.1.3`, `redux-thunk@2.4.2`
- **Option C:** Migrate to `@reduxjs/toolkit@1.9.7` (modern Redux wrapper)

### 7. UI Libraries (Non-breaking upgrades)
- `styled-components`: `^5.1.0` → `^6.1.0`
- `react-select`: `^3.1.0` → `^5.8.0`
- `react-spring`: `^8.0.27` → `^9.7.3`
- `@reach/dialog`: `^0.10.0` → `^0.18.0`
- `@reach/tooltip`: `^0.10.0` → `^0.18.0`

### 8. Testing Libraries
- `@testing-library/react`: `^9.3.2` → `^14.1.2`
- `@testing-library/jest-dom`: `^4.2.4` → `^6.1.5`
- `@testing-library/dom`: `^6.12.2` → `^9.3.3`

### 9. Dev Tools & Linting
- `eslint`: `^6.8.0` → `^8.54.0`
- Add `eslint-config-react-app@latest` (built-in for Vite)
- Remove `eslint-plugin-flowtype@^4.6.0` (no Flow support needed)
- Add TypeScript support gradually: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`

### 10. Remove/Deprecate
These are breaking/no-longer-needed:
- ❌ `3box@^1.17.1` → Replace with Ceramic or wallet-based auth
- ❌ `3box-chatbox-react@^0.1.10` → Replace with custom chat or managed service
- ❌ `peerjs@^1.2.0` → Replace with LiveKit, Daily, or self-hosted WebRTC
- ❌ `@zoomus/websdk@^1.7.5` → Verify if still in use; consider Zoom API v2
- ❌ `react-scripts@^3.3.1` (CRA v3) → Vite replaces this entirely

## Implementation Sequence

### Step 1: Prep & Backup
```bash
git checkout -b phase-2/core-stack-upgrade
npm ci  # Clean install with existing lock file
```

### Step 2: Update React & related
```json
"react": "18.3.1",
"react-dom": "18.3.1",
"react-router-dom": "6.20.0"
```

### Step 3: Replace CRA with Vite
1. Remove `react-scripts` from dependencies
2. Add Vite and plugins:
   ```json
   "vite": "5.0.10",
   "@vitejs/plugin-react": "4.2.1",
   "@types/react": "^18.2.37",
   "@types/react-dom": "^18.2.15"
   ```
3. Create `vite.config.js`:
   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000,
       proxy: {
         '/api': 'http://localhost:5000'
       }
     },
     build: {
       outDir: 'dist',
       sourcemap: false
     }
   })
   ```
4. Update `public/index.html` (Vite expects this at root):
   - Add `<script type="module" src="/src/index.jsx"></script>`
5. Rename `src/index.js` → `src/index.jsx`

### Step 4: Update package.json scripts
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "lint": "eslint src --ext .js,.jsx,.ts,.tsx"
}
```

### Step 5: Upgrade Web3 Stack
```json
"ethers": "6.10.0",
"@apollo/client": "3.8.0",
"graphql": "16.8.0"
```

### Step 6: Update imports in source code
- React 18: `import React from 'react'` no longer needed (except hooks)
- Apollo: Move from `apollo-boost` → `@apollo/client` import pattern
- Ethers v6: Rewrite contract interactions, signer usage

### Step 7: UI Library Updates (minor)
```json
"styled-components": "6.1.0",
"react-select": "5.8.0",
"react-spring": "9.7.3"
```

### Step 8: Add Testing Framework (Vitest)
```json
"vitest": "^1.0.4",
"@vitest/ui": "^1.0.4",
"jsdom": "^23.0.1"
```

### Step 9: Update ESLint Config
```json
"eslint": "8.54.0",
"eslint-plugin-react": "^7.33.2",
"eslint-plugin-react-hooks": "^4.6.0"
```

## Files to Create/Modify

### New files:
- `vite.config.js` - Vite configuration
- `vitest.config.js` - Test runner config (if using Vitest)
- `.eslintrc.cjs` - ESLint config (Vite prefers .cjs)

### Modify:
- `package.json` - Replace dependencies, update scripts
- `public/index.html` - Add module script
- `src/index.js` → `src/index.jsx` - Update for React 18 root API

### Code changes required:
- `src/index.jsx` - Replace `ReactDOM.render()` with `createRoot()`
- All components - Review for React 18 strict mode issues
- Router files - Convert from v5 to v6 syntax
- Context files - Update Apollo client initialization
- Contract interaction files - Update for ethers v6
- Web3 connectors - Update for latest web3-react

## Migration Complexity by Component

### High Priority (breaking changes):
1. `src/index.js` - React root initialization
2. `src/pages/App.js` - React Router v6 conversion
3. `src/utils/signer.js` - Ethers v6 API update
4. `src/contexts/Application.js` - Apollo client v3 update

### Medium Priority:
5. `src/connectors/` - Check web3-react compatibility with ethers v6
6. `src/components/` - React 18 strict mode compliance
7. `src/hooks/` - Update any custom hooks for React 18

### Low Priority:
8. UI components styling (styled-components minor version bump)
9. Tests - Migrate from jest to vitest (optional but recommended)

## Validation Checkpoints

1. ✅ `npm install` succeeds (no peer dep warnings)
2. ✅ `npm run dev` starts dev server on http://localhost:3000
3. ✅ Page loads without errors in browser console
4. ✅ Wallet connection works
5. ✅ Read contract data (balance, allowance)
6. ✅ Write contract interaction (approve, transfer)
7. ✅ Chat/messaging features work (post Phase 3: replace 3box)
8. ✅ Video features work (post Phase 3: replace peerjs)
9. ✅ `npm run build` creates `dist/` folder
10. ✅ `npm run test` runs tests (if test framework updated)
11. ✅ `npm run lint` passes

## Estimated Effort

- **React 18 + Router v6:** ~4-6 hours
- **Vite migration:** ~3-4 hours
- **Ethers v6 + Apollo v3:** ~6-8 hours
- **Testing & validation:** ~4-6 hours
- **Total:** ~17-24 hours

## Next Steps After Phase 2

Once Phase 2 is complete and validated:
- Move to **Phase 3:** Replace 3box, peerjs, and deprecated infrastructure
- Then **Phase 4:** Harden contract/wallet/error handling
- Then **Phase 5:** Add comprehensive tests and deployment docs
