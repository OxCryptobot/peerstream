# PayTray Backend Server

Production-ready backend server for PayTray platform with LiveKit token generation, wallet verification, and payment streaming.

## Features

✨ **Core Services**
- **LiveKit Token Generation** - Generate secure tokens for video calls
- **Wallet Verification** - Verify Ethereum wallets and get balance info
- **Profile Management** - Save/retrieve user profiles (Ceramic ready)
- **Payment Streaming** - Create and manage payment streams (Sablier ready)

🔐 **Security**
- Rate limiting on token generation
- Wallet address validation
- CORS protection
- JWT authentication ready
- Environment variable configuration

🌍 **Multi-Chain Support**
- Ethereum (Mainnet)
- Sepolia (Testnet)
- Arbitrum (Layer 2)
- Optimism (Layer 2)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Environment variables configured

### Installation

```bash
cd packages/backend
npm install
```

### Configuration

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your configuration:
```
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=https://your-livekit-instance.com
VITE_ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
# ... other configs
```

### Running

**Development**:
```bash
npm run dev
```
Server will start at `http://localhost:3001`

**Production**:
```bash
npm start
```

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "paytray-backend",
  "timestamp": "2026-07-06T12:00:00Z",
  "livekit": {
    "configured": true,
    "url": "https://your-livekit-instance.com"
  }
}
```

## API Endpoints

### 🎥 LiveKit Token Generation
`POST /api/livekit/token`

Generate JWT tokens for joining LiveKit video rooms.

**Request**:
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "roomName": "expert-call-123",
  "username": "John Expert",
  "canPublish": true,
  "canPublishData": true,
  "canSubscribe": true
}
```

**Response**:
```json
{
  "token": "eyJhbGc...",
  "url": "https://your-livekit-instance.com",
  "expiresIn": 86400,
  "room": "expert-call-123",
  "identity": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0"
}
```

**Error Handling**:
- `400` - Invalid wallet or room name
- `429` - Rate limited (max 10 tokens per minute)
- `500` - Server error

### 🔐 Wallet Verification
`POST /api/wallet/verify`

Verify wallet address and get balance information.

**Request**:
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "chainId": 1
}
```

**Response**:
```json
{
  "valid": true,
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "network": "Ethereum",
  "chainId": 1,
  "balance": "2.5",
  "ensName": "john.eth",
  "verified": true
}
```

### 👤 Profile Management
`GET /api/profile/:wallet`

Retrieve user profile (Ceramic integration ready).

**Response**:
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "profile": null,
  "message": "Ceramic integration coming soon"
}
```

`POST /api/profile/:wallet`

Save user profile.

**Request**:
```json
{
  "name": "John Expert",
  "bio": "Smart contract developer",
  "expertise": ["Solidity", "Web3.js"],
  "hourlyRate": 150,
  "socialLinks": {
    "twitter": "https://twitter.com/johnexpert",
    "github": "https://github.com/johnexpert"
  }
}
```

### 💰 Payment Streaming
`POST /api/payment/stream/create`

Create a payment stream using Sablier (integration ready).

**Request**:
```json
{
  "sender": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "recipient": "0x123...",
  "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "amount": "1000",
  "duration": 2592000
}
```

**Response**:
```json
{
  "status": "pending",
  "sender": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "recipient": "0x123...",
  "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "amount": "1000",
  "duration": 2592000,
  "message": "Sablier integration coming soon"
}
```

## Security Considerations

### Rate Limiting
- **Token Generation**: Max 10 tokens per minute per wallet
- Prevents abuse and token generation attacks

### Wallet Validation
- Uses `ethers.isAddress()` for validation
- Checks against supported networks
- Verifies RPC endpoints

### CORS
- Whitelist frontend origins in production
- Support for multiple environments (dev, staging, production)

### Environment Variables
- All sensitive data in `.env.local` (never commit)
- Use different keys for each environment
- Rotate secrets regularly

## Production Deployment

### Environment Setup

1. **LiveKit Deployment**
   - Deploy LiveKit instance or use managed service
   - Get API key and secret
   - Set `LIVEKIT_URL` and credentials

2. **RPC Endpoints**
   - Set up Alchemy, Infura, or Ankr accounts
   - Get API keys for each network
   - Add to environment

3. **Database**
   - Set up PostgreSQL database
   - Configure `DATABASE_URL`
   - Run migrations

### Deployment Options

**Heroku**:
```bash
git push heroku main
```

**Docker**:
```bash
docker build -t paytray-backend .
docker run -p 3001:3001 paytray-backend
```

**AWS/DigitalOcean**:
- Use environment configuration
- Set up SSL/TLS
- Configure DNS

## Testing

```bash
npm test
```

## Development

### File Structure
```
packages/backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example           # Environment template
├── .env.local             # Local configuration (git-ignored)
├── middleware/            # Express middleware
├── routes/                # API routes
├── services/              # Business logic
├── utils/                 # Helper functions
└── tests/                 # Test suites
```

### Adding New Endpoints

1. Create route handler in `routes/`
2. Add validation middleware
3. Implement business logic
4. Add tests
5. Document in API section above

### Best Practices

- ✅ Validate all inputs
- ✅ Use try-catch for error handling
- ✅ Log important events
- ✅ Rate limit sensitive endpoints
- ✅ Use environment variables for config
- ✅ Document API endpoints
- ✅ Write tests for new features
- ✅ Keep secrets out of code

## Roadmap

### Phase 1 (Current)
- ✅ LiveKit token generation
- ✅ Wallet verification
- ✅ Multi-chain support
- 🔄 Profile management (Ceramic ready)
- 🔄 Payment streaming (Sablier ready)

### Phase 2
- [ ] Database integration (PostgreSQL)
- [ ] JWT authentication
- [ ] Email notifications
- [ ] Advanced analytics

### Phase 3
- [ ] Ceramic Network integration
- [ ] Sablier payment streaming
- [ ] GraphQL API
- [ ] Webhooks

## Troubleshooting

### Token Generation Fails
- Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
- Verify `LIVEKIT_URL` is correct
- Ensure wallet address is valid

### Wallet Verification Fails
- Check RPC endpoint configuration
- Verify network chainId is supported
- Ensure RPC API has sufficient quota

### CORS Issues
- Update `FRONTEND_URL` in `.env.local`
- Check CORS middleware configuration
- Verify origin headers in request

## Support

For issues or questions:
- 📧 Email: support@paytray.io
- 📚 Docs: https://docs.paytray.io
- 💬 Discord: https://discord.gg/paytray

## License

MIT

## Contributors

PayTray Team - https://paytray.io
