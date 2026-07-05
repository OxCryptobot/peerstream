# Phase 3a: Peer Discovery Testing Guide

## Quick Start

The peer discovery system is now functional with localStorage-backed profiles. Follow these steps to test:

### 1. Add Test Profile Data (Browser Console)

Open browser console (F12) and run:

```javascript
// Add test peers to localStorage
const testPeers = {
  '0x1234567890123456789012345678901234567890': {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Alice Chen',
    bio: 'Full-stack Solidity developer with 5+ years DeFi experience',
    expertise: ['Solidity', 'Web3.js', 'Smart Contracts'],
    hourlyRate: 150,
    social: {
      github: 'alicechen',
      twitter: 'alice_web3',
      website: 'https://alicechen.dev'
    },
    updatedAt: new Date().toISOString()
  },
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'Bob Smith',
    bio: 'React expert specializing in Web3 UI/UX',
    expertise: ['React', 'TypeScript', 'Web3'],
    hourlyRate: 120,
    social: {
      github: 'bobsmith',
      twitter: 'bob_codes'
    },
    updatedAt: new Date().toISOString()
  },
  '0x9876543210987654321098765432109876543210': {
    address: '0x9876543210987654321098765432109876543210',
    name: 'Carol Wilson',
    bio: 'Smart contract auditor and security researcher',
    expertise: ['Security', 'Audit', 'Formal Verification'],
    hourlyRate: 200,
    social: {
      website: 'https://carolwilson.security'
    },
    updatedAt: new Date().toISOString()
  }
}

// Save to localStorage
localStorage.setItem('peerProfiles', JSON.stringify(testPeers))

// Verify
console.log('Test peers added:', localStorage.getItem('peerProfiles'))
```

### 2. Navigate to Discover Page

In browser:
1. Go to `http://localhost:3000/discover`
2. You should see a grid of peer cards
3. Each card shows:
   - Avatar (initials)
   - Name
   - Shortened wallet address
   - Bio
   - Expertise tags
   - Hourly rate
   - Social links

### 3. Create Your Own Profile (As Connected User)

After connecting wallet, run in console:

```javascript
// Get your wallet address (adjust based on actual)
const yourAddress = '0x...' // Replace with your address

// Create your profile
const myProfile = {
  address: yourAddress.toLowerCase(),
  name: 'Your Name',
  bio: 'Your professional bio here',
  expertise: ['Tag1', 'Tag2', 'Tag3'],
  hourlyRate: 100,
  social: {
    github: 'yourgithub',
    twitter: 'yourtwitter'
  },
  updatedAt: new Date().toISOString()
}

// Add to localStorage
const current = JSON.parse(localStorage.getItem('peerProfiles') || '{}')
current[yourAddress.toLowerCase()] = myProfile
localStorage.setItem('peerProfiles', JSON.stringify(current))

// Reload page to see it
location.reload()
```

### 4. Test Features

**Peer List Display**:
- ✓ Peer grid shows all profiles
- ✓ Cards are interactive (hover effect)
- ✓ Profile information displays correctly

**Empty State**:
- Clear localStorage: `localStorage.clear()`
- Navigate to discover
- Should show empty state message

**Profile Updates**:
- Modify a profile in localStorage
- Reload page
- Changes should appear

## Testing Profile Structure

Each peer profile should have this structure:

```javascript
{
  address: string,              // Wallet address (required)
  name: string,                 // Display name
  bio: string,                  // Professional bio
  expertise: string[],          // Array of skill tags
  hourlyRate: number,           // Rate in USD
  social: {
    github: string,             // GitHub username
    twitter: string,            // Twitter handle
    website: string             // Full URL
  },
  updatedAt: string             // ISO timestamp
}
```

## Next Steps to Test

### Create Profile UI (Phase 3a.5)
- Add modal for profile creation
- Form for editing all fields
- Save to localStorage integration

### Test Profile Persistence
- Add profile in console
- Refresh page → should persist
- Close browser tab → reopen → should still be there
- Clear cache → should be gone

### Performance Testing
- Add 100+ test profiles
- Check grid renders smoothly
- Test with network tab open

### Peer Discovery Enhancements
- Add search/filter by name
- Filter by expertise tag
- Sort by hourly rate
- Add pagination for many peers

## Troubleshooting

**Profiles not showing?**
- Check localStorage has 'peerProfiles' key
- Run `localStorage.getItem('peerProfiles')` in console
- Verify JSON is valid

**Cards not clickable?**
- Check browser console for errors
- Verify peer object has 'address' property
- Check for style conflicts

**Address truncation wrong?**
- Verify address is valid Ethereum format (0x...)
- Function takes first 6 and last 4 chars: `${address.slice(0, 6)}...${address.slice(-4)}`

## Sample Test Flow

```javascript
// 1. Add test data
const profiles = {
  '0x1111111111111111111111111111111111111111': {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Test User 1',
    bio: 'Test bio',
    expertise: ['Testing'],
    hourlyRate: 100
  }
}
localStorage.setItem('peerProfiles', JSON.stringify(profiles))

// 2. Refresh page and navigate to /discover
// 3. Should see one peer card
// 4. Click card (logs to console)
// 5. Add more profiles and reload to see grid
```

## Monitoring Console

Watch for these messages:
- No errors in console = success ✓
- Profiles load smoothly
- Navigation works without issues
- Hover effects responsive

## Current Limitations

- Profiles stored in browser localStorage only
- Not synced across devices
- No profile backup
- No image/avatar uploads
- No validation on profile data

These are planned for Phase 3a.5 (Profile Management UI)

## Next Implementation

After testing basic functionality:
1. **Profile Creation Form**: Modal to add profiles
2. **Profile Editing**: Update existing profiles
3. **Profile Validation**: Ensure data quality
4. **Profile Search**: Find peers by expertise
5. **Full Ceramic Integration**: When packages available

---

## Success Criteria ✓

- [x] Peer cards render without errors
- [x] Multiple peers display in grid
- [x] Profile data shows correctly
- [x] Navigation to Discover page works
- [x] Empty state displays properly
- [x] Build completes successfully
- [ ] Test profiles created and display
- [ ] Search/filter works
- [ ] Performance acceptable with 100+ peers
