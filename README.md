# 💳 PayTray

**Pay with Purpose** - Connect with expert freelancers, collaborate in real-time, and get paid instantly on blockchain.

PayTray is a next-generation platform that synergizes **expert discovery**, **real-time communication**, and **instant blockchain payments** into one seamless experience. Built on Ethereum and powered by Sablier for payment streams, PayTray eliminates friction from freelance engagement.

## 🎯 Core Features

### For Service Providers (Experts)
1. **Create Your Profile** - Showcase your expertise, rates, and social links
2. **Get Discovered** - Appear in the marketplace for clients seeking your skills
3. **Real-Time Collaboration** - Video chat, messaging, and screen sharing with clients
4. **Instant Earnings** - Receive payments via payment streams, withdraw anytime
5. **Multi-Chain Support** - Accept payments on Ethereum, Arbitrum, Optimism, and more

### For Clients
1. **Browse Experts** - Discover top talent filtered by expertise and availability
2. **Connect Instantly** - Message, video call, and share screens with providers
3. **Payment Streams** - Pay per minute with full control - start, pause, or cancel anytime
4. **No Hidden Fees** - Direct blockchain payments with transparent on-chain transactions
5. **Flexible & Secure** - Payments managed by smart contracts, funds always in your control

## 💡 The PayTray Advantage

### Smart Payment Streams
- **Pay-as-you-go**: No lump sum commitments. Stop anytime.
- **Any ERC-20 Token**: Choose your payment currency (USDC, DAI, USDT, etc.)
- **Instant Withdrawals**: Service providers withdraw funds in real-time
- **Full Transparency**: All transactions on-chain, auditable and trustless

### Decentralized Profiles
- **Ceramic Network**: Your profile data is yours - stored decentralized
- **Portable Reputation**: Build reputation that follows you across applications
- **Privacy First**: Only share what you want to share
- **Self-Sovereign Identity**: No intermediary controls your data

### Real-Time Communication
- **Video & Messaging**: Built with LiveKit for high-quality real-time communication
- **End-to-End Encryption**: Your conversations stay private
- **Screen Sharing**: Collaborate on code, designs, and documents
- **Recording Support**: Archive important calls and meetings

## 🏗️ Architecture

### Phase 3a: Peer Discovery ✅ COMPLETE
- Expert marketplace with profile management
- Ceramic-based decentralized profile storage
- Responsive peer grid UI with modern fintech design

### Phase 3a.5: Profile Management (IN PROGRESS)
- User profile creation and editing
- Portfolio showcase
- Rating and review system

### Phase 3b: Real-Time Communication (PLANNED)
- LiveKit integration for video/messaging
- Meeting scheduling
- Session recordings

### Phase 3c: Multi-Chain Support (PLANNED)
- Network switcher UI
- Multi-chain payment support
- Yield farming optimization

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - Modern UI framework with concurrent rendering
- **Vite 5.0** - Lightning-fast build and dev server
- **styled-components** - Component-scoped styling
- **ethers.js v6** - Web3 integration
- **@web3-react** - Wallet connection management

### Blockchain
- **Ethereum & EVM Chains** - Multi-chain support
- **Sablier** - Payment stream protocol
- **Smart Contracts** - Payment automation

### Decentralized Storage
- **Ceramic Network** - Profile data storage
- **IPFS** - Content addressing (via Ceramic)

### Real-Time Communication (Phase 3b)
- **LiveKit** - Video & messaging infrastructure

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 11
- A Web3 wallet (MetaMask, Ledger, etc.)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run react-app:start

# Build for production
npm run react-app:build
```

### Environment Setup
Copy `.env.local` and configure:
```env
VITE_APP_NAME=PayTray
VITE_CERAMIC_URL=http://localhost:7007
VITE_LIVEKIT_URL=wss://livekit.example.com
```

## 📊 Project Status

| Phase | Component | Status |
|-------|-----------|--------|
| 3a | Peer Discovery | ✅ Complete |
| 3a.5 | Profile Management | 🔄 In Progress |
| 3b | Real-Time Communication | ⏳ Planned |
| 3c | Multi-Chain Support | ⏳ Planned |

## 🎨 Design System

**Modern Fintech Theme:**
- Primary: Deep Blue (`#1E40AF`)
- Accent: Vibrant Purple (`#7C3AED`)
- Tertiary: Cyan (`#06B6D4`)
- Typography: Inter font family
- Responsive: Mobile-first design

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

## 🤝 Contributing

Contributions are welcome! Please fork, create a feature branch, and submit a pull request.

## 💬 Support

For issues, questions, or suggestions, please open a GitHub issue or reach out to the team.

---

**PayTray** - *Pay with Purpose* 💳


## 👩🏻‍💻 Development

1. Clone this repository `git clone https://github.com/nichanank/peerstream.git`
2. Install parent directory dependancies `npm i`
3. Install app dependancies `cd packages/react-app && npm i`
4. Bring up the app with `yarn start` and it should be running on `localhost:3000`

### How to get Testnet DAI

Testnet DAI is an ERC-20 token that was made for the purposes of testing decentralized applications. It is available on all the Ethereum networks (Rinkeby, Kovan, Ropsten etc.). Here is the token's [source code](https://github.com/PaulRBerg/contractz/blob/e8f89b20a2531f9f126b3ba1f6f6687a09414c09/contracts/TestnetDAI.sol)

1. You can mint yourself some Testnet DAI by going to the contract on their respective Etherscan-s, navigating to `Contract` and then `Write Contract`. 

- Kovan: https://kovan.etherscan.io/token/0x7d669a64deb8a4a51eea755bb0e19fd39ce25ae9#writeContract
- Rinkeby: https://rinkeby.etherscan.io/address/0xc3dbf84abb494ce5199d5d4d815b10ec29529ff8#writeContract
- Ropsten: https://ropsten.etherscan.io/address/0x2d69ad895797c880abce92437788047ba0eb7ff6#writeContract
- Goerli: https://goerli.etherscan.io/address/0xf2d1f94310823fe26cfa9c9b6fd152834b8e7849#writeContract

2. Click `Connect to Web3` to sign in with your wallet and get your tokens by calling the `mint` function. 

3. Because Testnet DAI adheres to the ERC-20 standard, whose token decimals is 18, remember to add 18 zeros to the amount you want to mint. For example if you wanted to mint 9999 TestnetDAI you would put `9999000000000000000000`. Double check that the testnet Etherscan that you're on matches the one on your Web3 wallet.

Once you have your TestnetDAI you're good to go to test the payment streams feature in the demo! Sign in with your Web3 wallet on the same test network and click `Start Stream` on a Peer Card. Unlike with Etherscan, the app takes care of the 18 token decimals, so if you want to stream 100 tokens to the Peer just put 100.

## 🔮 What might the future hold?

- Virtual world architects are streamed MANA for their time designing in-world estates for clients
- Beta testers are streamed DAI for interacting with and giving live feedback on new applications
- Experienced engineers and security experts are streamed cDAI for giving private workshops and webinars
- Pay-per-minute-stream for your attendance in online classes instead of paying lump sum for access at the beginning
- Micro-consulting. Get paid even for 10 minutes of your time to answer quick questions from one-time clients
- ... and much more. The world is our oyster guys and gals

## About

This project was built for the [DragonQuest virtual hackathon](https://hackathon.metacartel.org/) which took place from the 1st to 30th April 2020. I had been excited about the prospect of money streaming and user-owned data for a while and saw that this hackathon came at a great time for me to experiment with both. The project was bootstrapped with [Create Eth App](https://github.com/paulrberg/create-eth-app) and the [Sablier Template](https://github.com/PaulRBerg/create-eth-app/tree/develop/templates/sablier). The boilerplate comes with a basic example for how to connect and pull data from the [Sablier subgraph](https://thegraph.com/explorer/subgraph/sablierhq/sablier).

This template contains two packages:

- [contracts](/packages/contracts)
- [react-app](/packages/react-app)