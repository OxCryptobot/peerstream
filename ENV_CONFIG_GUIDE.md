# Environment Configuration Guide

## Overview
This file documents all environment variables needed for PeerStream to function with Ceramic, LiveKit, and blockchain infrastructure.

## Environment Templates

### Development (.env.local)
```bash
# Ceramic Network
VITE_CERAMIC_URL=http://localhost:7007
VITE_CERAMIC_SEED=your_ceramic_seed_here

# LiveKit (optional, placeholder during Ceramic integration)
VITE_LIVEKIT_URL=wss://livekit.example.com
VITE_LIVEKIT_API_KEY=your_livekit_api_key
VITE_LIVEKIT_API_SECRET=your_livekit_api_secret

# Network RPC Endpoints
VITE_ETHEREUM_RPC=https://eth.public-rpc.com
VITE_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
VITE_OPTIMISM_RPC=https://mainnet.optimism.io

# Sablier GraphQL (optional, configure after backend setup)
VITE_SABLIER_GRAPH_URL=https://api.thegraph.com/subgraphs/name/sablierhq/sablier

# App Configuration
VITE_APP_NAME=PeerStream
VITE_APP_VERSION=2.0.0
VITE_DEBUG=true
```

### Production (.env.production)
```bash
# Ceramic Network (use managed service)
VITE_CERAMIC_URL=https://ceramic-mainnet.example.com
VITE_CERAMIC_SEED=production_seed_from_vault

# LiveKit Production
VITE_LIVEKIT_URL=wss://livekit-prod.example.com
VITE_LIVEKIT_API_KEY=prod_api_key_from_vault
VITE_LIVEKIT_API_SECRET=prod_api_secret_from_vault

# Network RPC Endpoints (Production)
VITE_ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
VITE_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
VITE_OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Sablier GraphQL (Production)
VITE_SABLIER_GRAPH_URL=https://api.thegraph.com/subgraphs/name/sablierhq/sablier

# App Configuration
VITE_APP_NAME=PeerStream
VITE_APP_VERSION=2.0.0
VITE_DEBUG=false
```

## Configuration Details

### Ceramic Network Setup

#### Development: Local Ceramic Node
```bash
# Install Ceramic CLI
npm install -g @ceramicnetwork/cli

# Start local Ceramic node
ceramic daemon
```

**Output:**
```
Ceramic server listening on http://localhost:7007
```

#### Production: Ceramic API / Managed Service
- **Option 1**: Self-hosted Ceramic node
- **Option 2**: Ceramic Cloud (https://ceramic.dev/)
- **Option 3**: 3ID Connect for browser-based identity

### LiveKit Setup

#### Development: LiveKit Cloud
1. Sign up at https://livekit.io/
2. Create a new project
3. Copy Server URL and API credentials to `.env.local`

```bash
# Example credentials (replace with your own)
VITE_LIVEKIT_URL=wss://livekit-xxxx.livekit.cloud
VITE_LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxx
VITE_LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Backend Token Generation (Required)
You'll need a backend API endpoint to generate LiveKit tokens:

```javascript
// Example: Node.js/Express backend
const { AccessToken } = require('livekit-server-sdk');

app.post('/api/livekit-token', async (req, res) => {
  const { roomName, userName } = req.body;
  
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );
  
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    identity: userName
  });
  
  const token = at.toJwt();
  res.json({ token });
});
```

### Network Configuration

#### RPC Endpoint Providers
1. **Ethereum**: 
   - Public: `https://eth.public-rpc.com`
   - Alchemy: `https://eth-mainnet.g.alchemy.com/v2/{KEY}`

2. **Sepolia (Testnet)**:
   - Infura: `https://sepolia.infura.io/v3/{KEY}`
   - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/{KEY}`

3. **Arbitrum**:
   - Public: `https://arb1.arbitrum.io/rpc`
   - Alchemy: `https://arb-mainnet.g.alchemy.com/v2/{KEY}`

4. **Optimism**:
   - Public: `https://mainnet.optimism.io`
   - Alchemy: `https://opt-mainnet.g.alchemy.com/v2/{KEY}`

### Getting API Keys

1. **Alchemy** (Best for Ethereum/Arbitrum/Optimism):
   - Sign up: https://alchemy.com/
   - Create app for each network
   - Copy URL to `.env`

2. **Infura** (Ethereum focused):
   - Sign up: https://infura.io/
   - Create project
   - Copy project ID to `.env`

3. **The Graph**:
   - Already configured for Sablier queries
   - May need GraphQL auth for high-volume queries

## Setup Steps

### Phase 3a: Ceramic Integration (This Week)
1. ✅ Create `.env.local` file with Ceramic development settings
2. ⏳ Start local Ceramic node: `ceramic daemon`
3. ⏳ Add `VITE_CERAMIC_URL=http://localhost:7007` to `.env.local`
4. ⏳ Create Ceramic context provider in `src/contexts/Ceramic.jsx`
5. ⏳ Integrate with Discover page

### Phase 3b: LiveKit Integration (Next Week)
1. Sign up for LiveKit Cloud
2. Add credentials to `.env.local`
3. Create backend token generation endpoint
4. Create LiveKit context provider
5. Integrate with Meeting page

### Phase 3c: Network Configuration (Following Week)
1. Sign up for Alchemy or Infura
2. Get API keys for each network
3. Update `src/constants/networks.js`
4. Add network selector to UI

## Validation Checklist

- [ ] `.env.local` created with all required variables
- [ ] Ceramic node running on `localhost:7007`
- [ ] LiveKit credentials obtained
- [ ] RPC endpoints tested with `ethers.provider.getBlockNumber()`
- [ ] Environment variables accessible in app via `import.meta.env.VITE_*`
- [ ] No hardcoded secrets in source code
- [ ] `.env.local` added to `.gitignore`

## Security Notes

⚠️ **IMPORTANT**: Never commit `.env.local` or `.env.production` to git!

```bash
# Add to .gitignore if not already present
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.*.local" >> .gitignore
```

## Accessing Variables in Code

```javascript
// Access environment variables
const ceramicUrl = import.meta.env.VITE_CERAMIC_URL
const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL

// Example in a context provider
export function CeramicProvider() {
  const url = import.meta.env.VITE_CERAMIC_URL
  if (!url) {
    throw new Error('VITE_CERAMIC_URL not configured')
  }
  // ... initialize Ceramic
}
```

## Troubleshooting

### "VITE_* variables undefined"
- Ensure variables start with `VITE_` prefix
- Check `.env.local` file exists in project root
- Restart dev server after editing `.env`

### "Ceramic connection refused"
- Verify Ceramic node running: `ceramic daemon`
- Check `VITE_CERAMIC_URL=http://localhost:7007`
- Try connecting manually: `curl http://localhost:7007/ping`

### "LiveKit token invalid"
- Verify API key and secret in backend
- Check room name format (alphanumeric + hyphen only)
- Ensure token expiry > current time

---

## Next Steps
1. Create `.env.local` with initial values
2. Commit to git (with `.env.local` in `.gitignore`)
3. Update CI/CD pipeline to handle environment secrets
4. Document production deployment procedure
