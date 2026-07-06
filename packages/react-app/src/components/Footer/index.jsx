import React from 'react'
import styled from 'styled-components'
import { ExternalLink } from '../../theme'

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: linear-gradient(180deg, #1E40AF 0%, #1a2e66 100%);
  border-top: 1px solid #7C3AED;
  padding: 2rem 1.5rem;
`

const FooterElement = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
`

const Title = styled.div`
  display: flex;
  flex-direction: row;
  font-family: 'Inter', sans-serif;
  justify-content: space-between;
  gap: 1.5rem;
  
  #link {
    text-decoration: none;
    color: #06B6D4;
    transition: all 0.3s ease;
    &:hover {
      color: #7C3AED;
      text-decoration: underline;
    }
  }
  
  #title {
    display: inline;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
    color: #E5E7EB;
    transition: all 0.3s ease;
    &:hover {
      color: #7C3AED;
    }
  }
`

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  #logo-icon {
    font-size: 1.2rem;
  }
`

export default function Footer() {
  return (
    <FooterFrame>
      <FooterElement>
        <Title>
          <ExternalLink id="link" href="https://github.com">
            <h1 id="title">GitHub</h1>
          </ExternalLink>
          <ExternalLink id="link" href="https://twitter.com">
            <h1 id="title">Twitter</h1>
          </ExternalLink>
          <ExternalLink id="link" href="https://docs.example.com">
            <h1 id="title">Documentation</h1>
          </ExternalLink>
        </Title>
      </FooterElement>
      <FooterElement>
        <BrandSection>
          <span id="logo-icon">💳</span>
          <Title>
            <h1 id="title">PayTray © 2024 • Pay with Purpose</h1>
          </Title>
        </BrandSection>
      </FooterElement>
    </FooterFrame>
  )
}