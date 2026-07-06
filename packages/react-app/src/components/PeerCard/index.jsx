import React from 'react'
import styled from 'styled-components'

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 1rem;
  padding: 1.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #1E40AF 0%, #7C3AED 50%, #06B6D4 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    box-shadow: 0 12px 24px rgba(30, 64, 175, 0.12);
    border-color: #7C3AED;
    transform: translateY(-4px);
    
    &::before {
      opacity: 1;
    }
  }
`

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 1rem;
  background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
`

const Name = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  color: #1F2937;
  text-align: center;
  word-break: break-word;
  font-weight: 600;
`

const Address = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #9CA3AF;
  text-align: center;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
`

const Bio = styled.p`
  color: #4B5563;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
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
  background: linear-gradient(135deg, #F0F4FF 0%, #F5EBFF 100%);
  color: #1E40AF;
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  white-space: nowrap;
  font-weight: 500;
  border: 1px solid #E0E7FF;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #E0E7FF 0%, #EDE9FE 100%);
    border-color: #7C3AED;
  }
`

const Rate = styled.p`
  margin: 0.75rem 0 0 0;
  font-weight: 600;
  color: #1E40AF;
  text-align: center;
  font-size: 1.15rem;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
  padding: 0.75rem;
  border-radius: 0.5rem;
`

const Social = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`

const SocialLink = styled.a`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.8rem;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
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