import React from 'react'
import styled from 'styled-components'

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid ${({ theme }) => theme.secondaryGreen};
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 1rem;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.primaryGreen};
    transform: translateY(-2px);
  }
`

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.primaryGreen}, ${({ theme }) => theme.secondaryGreen});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 auto;
`

const Name = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.primaryGreen};
  text-align: center;
  word-break: break-all;
`

const Address = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: #999;
  text-align: center;
  font-family: monospace;
  word-break: break-all;
`

const Bio = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
  text-align: center;
`

const Expertise = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
`

const Tag = styled.span`
  background-color: ${({ theme }) => theme.tertiaryGreen};
  color: ${({ theme }) => theme.primaryGreen};
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  white-space: nowrap;
`

const Rate = styled.p`
  margin: 0.5rem 0 0 0;
  font-weight: bold;
  color: ${({ theme }) => theme.primaryGreen};
  text-align: center;
`

const Social = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 0.85rem;
`

const SocialLink = styled.a`
  color: ${({ theme }) => theme.primaryGreen};
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.primaryGreen};
  border-radius: 0.25rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.primaryGreen};
    color: white;
  }
`

const getInitials = (name, address) => {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return address.slice(2, 4).toUpperCase()
}

const truncateAddress = (address) => {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
}

export default function PeerCard({ peer }) {
  const initials = getInitials(peer.name, peer.address)
  const displayName = peer.name || truncateAddress(peer.address)

  const handleClick = () => {
    // Navigate to peer detail or initiate chat
    // Would implement navigation here in a full app
    console.log('Click peer:', peer.address)
  }

  return (
    <Card onClick={handleClick}>
      <Avatar title={peer.address}>{initials}</Avatar>

      <div>
        <Name>{displayName}</Name>
        <Address title={peer.address}>{truncateAddress(peer.address)}</Address>
      </div>

      {peer.bio && <Bio>{peer.bio}</Bio>}

      {peer.expertise && peer.expertise.length > 0 && (
        <Expertise>
          {peer.expertise.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </Expertise>
      )}

      {peer.hourlyRate && <Rate>${peer.hourlyRate}/hr</Rate>}

      {(peer.social?.twitter || peer.social?.github || peer.social?.website) && (
        <Social>
          {peer.social?.github && (
            <SocialLink href={`https://github.com/${peer.social.github}`} target="_blank" rel="noopener noreferrer">
              GitHub
            </SocialLink>
          )}
          {peer.social?.twitter && (
            <SocialLink href={`https://twitter.com/${peer.social.twitter}`} target="_blank" rel="noopener noreferrer">
              Twitter
            </SocialLink>
          )}
          {peer.social?.website && (
            <SocialLink href={peer.social.website} target="_blank" rel="noopener noreferrer">
              Website
            </SocialLink>
          )}
        </Social>
      )}
    </Card>
  )
}