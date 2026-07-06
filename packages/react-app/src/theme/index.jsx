import React from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'styled-components'

export * from './components'

const MEDIA_WIDTHS = {
  upToSmall: 600,
  upToMedium: 960,
  upToLarge: 1280
}

const mediaWidthTemplates = Object.keys(MEDIA_WIDTHS).reduce((accumulator, size) => {
  accumulator[size] = (...args) => css`
    @media (max-width: ${MEDIA_WIDTHS[size]}px) {
      ${css(...args)}
    }
  `
  return accumulator
}, {})

const flexColumnNoWrap = css`
  display: flex;
  flex-flow: column nowrap;
`

const flexRowNoWrap = css`
  display: flex;
  flex-flow: row nowrap;
`

const white = '#FFFFFF'
const black = '#000000'

export default function ThemeProvider({ children }) {
  return <StyledComponentsThemeProvider theme={theme()}>{children}</StyledComponentsThemeProvider>
}

const theme = () => ({
  white,
  black,
  inputBackground: white,
  placeholderGray: '#E5E7EB',
  shadowColor: '#1E40AF',

  // PayTray Modern Fintech Color Palette
  primaryBlue: '#1E40AF',        // Deep trust blue
  accentPurple: '#7C3AED',        // Vibrant modern purple
  tertiaryChyan: '#06B6D4',       // Forward-thinking cyan
  
  // Supporting colors (deprecated old names for compatibility)
  primaryGreen: '#1E40AF',        // Maps to primary blue
  secondaryGreen: '#06B6D4',      // Maps to cyan
  tertiaryGreen: '#F3F4F6',       // Light neutral background
  darkMint: '#06B6D4',
  pink: '#7C3AED',
  connectedGreen: '#10B981',
  
  // Background colors
  bgLight: '#F9FAFB',
  bgDark: '#111827',
  
  // Success/Error
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // media queries
  mediaWidth: mediaWidthTemplates,
  
  // css snippets
  flexColumnNoWrap,
  flexRowNoWrap
})

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  html { font-family: 'Inter', sans-serif; }
  @supports (font-variation-settings: normal) {
    html { font-family: 'Inter var', sans-serif; }
  }
  
  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;    
  }
  body > div {
    height: 100%;
    overflow: scroll;
    -webkit-overflow-scrolling: touch;
  }
  html {
    font-size: 16px;
    font-variant: none;
    color: #1F2937;
    background-color: #F9FAFB;
    transition: color 150ms ease-out, background-color 150ms ease-out;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
`