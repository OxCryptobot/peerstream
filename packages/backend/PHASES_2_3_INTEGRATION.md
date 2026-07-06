# PayTray Phases 2-3 Integration Guide

## Phase 2: Ceramic Network Integration

### What is Ceramic?

Ceramic is a decentralized, open-source platform for managing composable data. It enables:
- **Self-sovereign profiles** - Users own their profile data
- **Portability** - Profiles work across multiple applications
- **Verifiability** - All data is cryptographically signed
- **Composability** - Other apps can use the same profile data

### Architecture

```
Frontend                Backend                 Ceramic Network
---------                -------                ---------------
CeramicProvider    →    CeramicService    →    Ceramic Node
  ├─ loadProfile         ├─ createProfile       ├─ Streams
  ├─ saveProfile         ├─ getProfile          ├─ Schemas
  ├─ searchProfiles      ├─ updateProfile       └─ Indexing
  └─ getExperts          ├─ searchProfiles
                         └─ getTrendingProfiles
```

### Backend Implementation

**File:** `packages/backend/services/ceramicService.js`

**Key Methods:**
```javascript
// Initialize Ceramic connection
const ceramic = initializeCeramic()
await ceramic.initialize()

// Create profile in Ceramic
const profile = await ceramic.createProfile(wallet, {
  displayName: 'John Doe',
  bio: 'Solidity developer',
  expertise: ['solidity', 'web3'],
  hourlyRate: 150,
  isExpert: true
})

// Search profiles
const results = await ceramic.searchProfiles('web3', {
  expertise: ['web3'],
  minRate: 100
})

// Get experts by specialty
const experts = await ceramic.getExpertsByExpertise('solidity', limit)

// Get trending profiles
const trending = await ceramic.getTrendingProfiles(limit)
```

### Frontend Integration

**File:** `packages/react-app/src/contexts/CeramicProvider.jsx`

**Usage in Components:**
```javascript
import { useCeramic } from '@/contexts/CeramicProvider'

function ProfileComponent() {
  const {
    loadProfile,
    saveProfile,
    searchProfiles,
    currentProfile,
    loading,
    error
  } = useCeramic()

  // Load profile
  useEffect(() => {
    loadProfile(walletAddress)
  }, [walletAddress])

  // Save profile
  const handleSave = async (data) => {
    await saveProfile(walletAddress, data)
  }

  // Search
  const handleSearch = async (query) => {
    const results = await searchProfiles(query)
  }
}
```

### API Endpoints - Phase 2

**Profile Management:**
```
GET    /api/profiles/:wallet           - Get user profile
POST   /api/profiles/:wallet           - Create/update profile
DELETE /api/profiles/:wallet           - Delete profile
```

**Profile Discovery:**
```
GET    /api/profiles/search            - Search profiles
       ?q=query&expertise=web3&minRate=100
GET    /api/profiles/experts/:expertise - Get experts by area
GET    /api/profiles/trending          - Get trending profiles
```

### Ceramic Stream Schema

```json
{
  "title": "PayTray Profile",
  "type": "object",
  "properties": {
    "wallet": { "type": "string", "pattern": "^0x[a-fA-F0-9]{40}$" },
    "displayName": { "type": "string", "minLength": 2, "maxLength": 255 },
    "bio": { "type": "string", "maxLength": 1000 },
    "avatar": { "type": "object", "properties": { "url": "string", "ipfsHash": "string" } },
    "expertise": { "type": "array", "items": "string", "maxItems": 20 },
    "hourlyRate": { "type": "number", "minimum": 0, "maximum": 100000 },
    "isExpert": { "type": "boolean", "default": false },
    "socialLinks": { "type": "object", "properties": { "twitter": "string", "github": "string" } },
    "verification": { "type": "object" },
    "metadata": { "type": "object", "properties": { "createdAt": "date-time", "completeness": "number" } }
  },
  "required": ["wallet", "displayName"]
}
```

### Profile Completeness Calculation

```
Profile Score = (filled_fields / total_fields) × 100

Fields:
  ✓ displayName
  ✓ bio
  ✓ avatar
  ✓ expertise
  ✓ hourlyRate
  ✓ socialLinks
  ✓ isExpert

0-20%   - Incomplete (Red)
21-50%  - Moderate (Yellow)
51-79%  - Good (Green)
80-100% - Excellent (Blue)
```

---

## Phase 3: Sablier Protocol Integration

### What is Sablier?

Sablier is a protocol for streaming payments on Ethereum, Arbitrum, and Optimism:
- **Linear streams** - Funds unlock linearly over time
- **Composable** - Works with any ERC-20 token
- **Cancellable** - Sender can cancel and recover funds
- **Transparent** - Real-time balance tracking

### Architecture

```
Frontend                Backend                 Smart Contracts
---------                -------                ----------------
SablierProvider    →    SablierService    →    Sablier V2
  ├─ createStream         ├─ createLinearStream  ├─ createLockupLinear
  ├─ getStreamStats       ├─ getStream           ├─ getStream
  ├─ withdrawFromStream    ├─ withdrawFromStream  ├─ withdraw
  └─ cancelStream         ├─ cancelStream        └─ cancelStream
                          └─ getStreamStats
```

### Payment Stream Lifecycle

```
1. Create
   ├─ Sender initiates stream
   ├─ Specifies recipient, amount, duration
   ├─ Sablier contract locks funds
   └─ Stream status: "active"

2. Streaming
   ├─ Time passes
   ├─ Funds unlock linearly
   ├─ Both parties can check balance
   └─ Real-time updates available

3. Withdrawal (Optional)
   ├─ Recipient withdraws available balance
   ├─ Before stream ends
   ├─ Partial withdrawals allowed
   └─ Remaining funds continue streaming

4. Completion
   ├─ Stream reaches end time
   ├─ All funds fully streamed
   ├─ Status: "completed"
   └─ Recipient claims remaining balance

5. Cancellation (Sender Only)
   ├─ Before stream end
   ├─ Unstreamed funds return to sender
   ├─ Streamed funds sent to recipient
   └─ Status: "canceled"
```

### Backend Implementation

**File:** `packages/backend/services/sablierService.js`

**Key Methods:**
```javascript
// Initialize Sablier
const sablier = initializeSablier()
await sablier.initialize()

// Create linear stream
const stream = await sablier.createLinearStream(
  senderAddress,       // 0x...
  recipientAddress,    // 0x...
  tokenAddress,        // USDC: 0x...
  amount,              // 1000 (USDC)
  duration,            // 2592000 (30 days in seconds)
  chainId = 1          // Ethereum mainnet
)

// Get stream details
const stream = await sablier.getStream(streamId, chainId)

// Get streamed amount (how much has unlocked)
const streamed = await sablier.getStreamedAmount(streamId, chainId)

// Calculate available balance
const available = streamed - stream.withdrawn

// Withdraw
const receipt = await sablier.withdrawFromStream(streamId, recipient, amount)

// Cancel stream
const result = await sablier.cancelStream(streamId)

// Get statistics
const stats = await sablier.getStreamStats(streamId)
```

### Frontend Integration

**File:** `packages/react-app/src/contexts/SablierProvider.jsx`

**Usage in Components:**
```javascript
import { useSablier } from '@/contexts/SablierProvider'

function PaymentComponent() {
  const {
    createStream,
    getUserStreams,
    withdrawFromStream,
    calculateProgress,
    formatStream,
    userStreams,
    loading
  } = useSablier()

  // Create stream
  const handleCreateStream = async (data) => {
    await createStream({
      recipientWallet: '0x...',
      token: 'USDC',
      amount: 1000,
      duration: 2592000,  // 30 days
      chainId: 1
    })
  }

  // Get user streams
  useEffect(() => {
    getUserStreams('sender', 'active')
  }, [])

  // Withdraw
  const handleWithdraw = async (streamId, amount) => {
    await withdrawFromStream(streamId, amount)
  }
}
```

### API Endpoints - Phase 3

**Stream Management:**
```
POST   /api/payments/streams           - Create new stream
GET    /api/payments/streams/:id       - Get stream details
GET    /api/payments/streams/:id/stats - Stream statistics
POST   /api/payments/streams/:id/withdraw - Withdraw funds
POST   /api/payments/streams/:id/cancel - Cancel stream
```

### Stream Data Structure

```javascript
{
  streamId: 12345,
  sender: '0x...',
  recipient: '0x...',
  token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  amount: 1000,
  startTime: 1704067200,        // Unix timestamp
  stopTime: 1706745600,         // Unix timestamp (30 days later)
  duration: 2678400,            // In seconds
  createdAt: '2024-01-01T00:00:00Z',
  status: 'active',             // active, completed, canceled
  cancelable: true,
  withdrawn: 0,                 // Amount already withdrawn
  chainId: 1,
  network: 'Ethereum',
  
  // Calculated fields
  streamed: 250,                // Amount unlocked so far
  available: 250,               // Amount available to withdraw
  progress: 25,                 // Percentage complete
  perMinute: 0.0116,            // Rate per minute
  perDay: 16.67,                // Rate per day
  remainingTime: {              // Time until completion
    days: 21,
    hours: 15,
    minutes: 30,
    total: 1890630               // In seconds
  }
}
```

### Supported Networks & Tokens

**Networks:**
- Ethereum Mainnet (ChainId: 1)
- Arbitrum (ChainId: 42161)
- Optimism (ChainId: 10)

**Tokens:**
- USDC (USD Coin)
- USDT (Tether)
- DAI (Dai Stablecoin)
- ETH (Ethereum)
- WETH (Wrapped ETH)

---

## Integration Flow

### User Flow: Create Payment Stream

```
1. User navigates to "Create Stream"
2. Selects recipient wallet
3. Chooses token (USDC, DAI, etc.)
4. Enters amount and duration
5. Preview shows:
   - Per-minute rate
   - Per-day rate
   - Estimated cost
6. Signs transaction
7. Stream created in Sablier
8. Stored in PayTray database
9. Recipient notified
```

### User Flow: Search for Experts

```
1. User searches "web3"
2. Ceramic searches profiles
3. Filters by:
   - Expertise
   - Hourly rate
   - Completeness
4. Results sorted by relevance
5. User can:
   - View profile
   - View past payments
   - Initiate video call
   - Create payment stream
```

---

## Configuration

### Environment Variables

```bash
# Ceramic (Phase 2)
CERAMIC_ENABLED=true
CERAMIC_NODE_URL=https://mainnet.ceramic.network
CERAMIC_NETWORK=mainnet

# Sablier (Phase 3)
SABLIER_ENABLED=true
SABLIER_ETHEREUM_ADDRESS=0x...
SABLIER_ARBITRUM_ADDRESS=0x...
SABLIER_OPTIMISM_ADDRESS=0x...

# RPC Endpoints (required for Sablier)
VITE_ETHEREUM_RPC=https://eth.llamarpc.com
VITE_ARBITRUM_RPC=https://arbitrum.drpc.org
VITE_OPTIMISM_RPC=https://optimism.drpc.org
```

---

## Error Handling

### Common Errors

**Ceramic Errors:**
```javascript
ValidationError  // Invalid profile data
AppError         // Profile not found
ExternalServiceError // Ceramic node unreachable
```

**Sablier Errors:**
```javascript
ValidationError  // Invalid stream parameters
AppError         // Stream not found / Insufficient balance
ExternalServiceError // Chain RPC unreachable
RateLimitError   // Too many requests
```

### Error Recovery

1. **Validation Errors**
   - Check input format
   - Validate wallet addresses
   - Verify amounts are positive

2. **Service Errors**
   - Fallback to local storage (Ceramic disabled)
   - Return cached data if available
   - Log errors for monitoring

3. **Network Errors**
   - Retry with exponential backoff
   - Notify user of connectivity issues
   - Queue pending transactions

---

## Testing

### Ceramic Testing

```javascript
// Test profile creation
const profile = await ceramic.createProfile(wallet, {
  displayName: 'Test User',
  bio: 'Test bio',
  expertise: ['testing'],
  hourlyRate: 100
})

// Test search
const results = await ceramic.searchProfiles('test')

// Test trending
const trending = await ceramic.getTrendingProfiles(10)
```

### Sablier Testing

```javascript
// Test stream creation
const stream = await sablier.createLinearStream(
  senderAddress,
  recipientAddress,
  tokenAddress,
  1000,           // 1000 tokens
  3600,           // 1 hour
  1               // Ethereum testnet
)

// Test withdrawal
const result = await sablier.withdrawFromStream(streamId, recipient, 100)

// Test cancellation
const canceled = await sablier.cancelStream(streamId)
```

---

## Production Checklist

**Before Deployment:**

- [ ] Ceramic node deployed and accessible
- [ ] Sablier contracts deployed to supported chains
- [ ] RPC endpoints configured for all chains
- [ ] Environment variables set correctly
- [ ] Database migrations run
- [ ] Profile schema deployed to Ceramic
- [ ] API endpoints tested
- [ ] Rate limiting tuned
- [ ] Error monitoring enabled
- [ ] User documentation complete

---

## Next Steps (Phase 4)

### Production Deployment

1. **Frontend Deployment**
   - Deploy to Vercel/Netlify
   - Configure custom domain
   - Set up CI/CD pipeline

2. **Backend Deployment**
   - Deploy to Heroku/DigitalOcean
   - Configure production database
   - Set up monitoring

3. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - User analytics

4. **Documentation**
   - API documentation
   - User guides
   - Developer documentation
