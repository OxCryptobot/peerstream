# Phase 3: Infrastructure Replacement Plan

## Overview
Phase 3 replaces three deprecated services with modern alternatives to enable peer discovery, video communication, and multi-chain support.

## Status: IN PROGRESS
- ✅ Phase 1 & 2 complete (React 18 + Vite + modern stack)
- ✅ Component rendering errors fixed
- ⏳ Infrastructure migrations pending

---

## 1. 3Box → Ceramic + IDX Migration

### Current Situation
- **3Box (deprecated)**: Used for peer identity and profile storage
- **Status**: No longer maintained, dapp.3box.io is offline
- **Impact**: Discover page cannot load peer profiles

### Replacement Strategy: Ceramic + IDX

#### Why Ceramic?
- Decentralized ceramic identity and data storage
- Self-sovereign identity (users control their own data)
- Interoperable ecosystem
- Active development and community support

#### Migration Steps

**Phase 3a: IDX Implementation (Week 1-2)**
1. Install dependencies:
   ```bash
   npm install --save @ceramicnetwork/3id-connect
   npm install --save @ceramicnetwork/http-client
   npm install --save @self.id/web
   npm install --save @self.id/framework
   ```

2. Create Ceramic context:
   ```jsx
   // src/contexts/Ceramic.jsx
   export function CeramicProvider({ children }) {
     const { account } = useWeb3React()
     const [self, setSelf] = useState(null)
     
     useEffect(() => {
       if (account) {
         initializeCeramic(account).then(setSelf)
       }
     }, [account])
     
     return <CeramicContext.Provider value={self}>{children}</CeramicContext.Provider>
   }
   ```

3. Update Discover page:
   ```jsx
   export function Discover() {
     const self = useCeramic()
     
     // Query profiles from Ceramic instead of 3Box
     const peers = useQuery(GET_PEERS_FROM_CERAMIC)
     
     return <PeerGrid peers={peers} />
   }
   ```

4. Profile schema (add to `src/schemas/profile.js`):
   ```javascript
   // Ceramic composite definition for peer profiles
   export const ProfileComposite = { /* BasicProfile schema */ }
   ```

**Fallback: Wallet-Based Identity (if Ceramic integration delayed)**
- Use ENS for display names
- Store minimal profile in localStorage
- Fallback to wallet address display

#### Implementation Timeline
- Week 1: Set up Ceramic HTTP client
- Week 2: Integrate with Discover page
- Week 3: Add profile editing UI
- Fallback: Use wallet addresses if not complete

---

## 2. PeerJS → LiveKit Migration

### Current Situation
- **PeerJS (deprecated)**: Used for peer-to-peer WebRTC video calling
- **Status**: Still maintained but complex for modern apps
- **Impact**: Meeting page cannot establish video connections

### Replacement Strategy: LiveKit

#### Why LiveKit?
- Modern, SFU-based (Selective Forwarding Unit) architecture
- Better performance than peer-to-peer for group calls
- Built-in recording and transcription
- Scalable infrastructure
- Easy integration with React

#### Migration Steps

**Phase 3b: LiveKit Implementation (Week 1-2)**
1. Install dependencies:
   ```bash
   npm install --save livekit-client
   npm install --save @livekit/react
   ```

2. Set up LiveKit server credentials (environment):
   ```bash
   # .env
   VITE_LIVEKIT_URL=wss://livekit-server.example.com
   VITE_LIVEKIT_API_KEY=your_api_key
   VITE_LIVEKIT_API_SECRET=your_api_secret
   ```

3. Create LiveKit context:
   ```jsx
   // src/contexts/LiveKit.jsx
   export function LiveKitProvider({ children }) {
     const { account } = useWeb3React()
     
     const generateToken = async (roomName) => {
       // Call backend to generate token for user
       const token = await fetchLiveKitToken(account, roomName)
       return token
     }
     
     return (
       <LiveKitContext.Provider value={{ generateToken }}>
         {children}
       </LiveKitContext.Provider>
     )
   }
   ```

4. Update Meeting page:
   ```jsx
   export function Meeting() {
     const { roomName } = useParams()
     const livekit = useLiveKit()
     
     return (
       <LiveKitRoom
         url={LIVEKIT_URL}
         token={token}
         onConnected={() => console.log('Connected')}
       >
         <VideoConference />
       </LiveKitRoom>
     )
   }
   ```

#### Implementation Timeline
- Week 1: Set up LiveKit client library
- Week 2: Integrate with Meeting page
- Week 3: Add stream configuration for payments
- Fallback: Simple voice chat placeholder if video delayed

#### Backend Requirements
- LiveKit server setup (self-hosted or managed service)
- Token generation endpoint
- User authentication/room management

---

## 3. Network Configuration Updates

### Current Situation
- **Hardcoded Networks**: Limited to main networks
- **Deprecated Testnets**: Rinkeby, Goerli may be deprecated
- **Impact**: Users cannot switch networks easily

### Replacement Strategy: Modern Multi-Chain

#### Network Configuration:
```javascript
// src/constants/networks.js
export const NETWORKS = {
  // Mainets
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpc: 'https://eth.public-rpc.com',
    explorer: 'https://etherscan.io'
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io'
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpc: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io'
  },
  // Testnets
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpc: 'https://sepolia.infura.io/v3/YOUR_API_KEY',
    explorer: 'https://sepolia.etherscan.io'
  }
}
```

#### Steps:
1. Update network connector to support dynamic chain switching
2. Add network selector to Web3Status component
3. Migrate test contracts to Sepolia
4. Update Sablier integration for multi-chain

---

## 4. Remaining Deprecation Warnings

### React-Alert defaultProps
- **Issue**: Library using deprecated React pattern
- **Solution**: Upgrade to newer version or replace with custom alert
- **Priority**: Low (warning only, not blocking)

### Timeline: Handle in Phase 3.5 if time permits

---

## Implementation Roadmap

| Week | Component | Status | Notes |
|------|-----------|--------|-------|
| Week 1 | Modal fix + Web3Status | ✅ Done | Component rendering working |
| Week 2 | Ceramic integration | ⏳ TODO | Profile/identity system |
| Week 2 | LiveKit integration | ⏳ TODO | Video calling |
| Week 3 | Network configuration | ⏳ TODO | Multi-chain support |
| Week 4 | Testing & optimization | ⏳ TODO | Load testing, error handling |
| Week 5 | Documentation & deploy | ⏳ TODO | Mainnet ready |

---

## Fallback Strategies

If any primary strategy encounters blockers:

1. **Ceramic delays?** → Use local localStorage + ENS for identity
2. **LiveKit delays?** → Implement basic voice chat with WebAudio API
3. **Network config delays?** → Keep Ethereum mainnet only initially
4. **Backend not ready?** → Use read-only mode with demo data

---

## Success Criteria for Phase 3

- [ ] App renders without critical errors
- [ ] Discover page shows peer list (with IDX/Ceramic)
- [ ] Meeting page initiates video calls (with LiveKit)
- [ ] Users can switch between networks
- [ ] All pages accessible and functional
- [ ] No console errors (excluding external API failures)
- [ ] Production build succeeds
- [ ] Deployment ready

---

## Next Steps

1. **Immediate (this session)**:
   - Plan Ceramic integration
   - Plan LiveKit backend setup
   - Set up environment variables

2. **Next session**:
   - Implement Ceramic context provider
   - Integrate with Discover page
   - Test profile storage

3. **Following session**:
   - Implement LiveKit context
   - Integrate with Meeting page
   - Set up backend token generation

---

## Resources

- Ceramic Docs: https://developers.ceramic.network/
- IDX Docs: https://idx.xyz/
- LiveKit Docs: https://docs.livekit.io/
- Sablier Multi-chain: https://docs.sablier.finance/
