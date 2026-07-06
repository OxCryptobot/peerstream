import React from 'react'
import ReactDOM from 'react-dom/client'
import { ethers } from 'ethers'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { types, transitions, positions, Provider as AlertProvider } from 'react-alert'
import AlertTemplate from 'react-alert-template-basic'
import App from './pages/App'
import './index.css'

import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TokensContextProvider, { Updater as TokensContextUpdater } from './contexts/Tokens'
import { CeramicProvider } from './contexts/Ceramic'
import MultiWalletProvider from './contexts/MultiWallet'
import ThemeProvider from './theme'

require('./App.css')

// Alert configuration
const alertOptions = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: '30px',
  type: types.INFO,
  transition: transitions.SCALE
}

// Apollo Client v3 initialization
const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/sablierhq/sablier',
  cache: new InMemoryCache()
})

function ContextProviders({ children }) {
  return (
    <MultiWalletProvider>
      <ApplicationContextProvider>
        <TokensContextProvider>
          <CeramicProvider>
            {children}
          </CeramicProvider>
        </TokensContextProvider>
      </ApplicationContextProvider>
    </MultiWalletProvider>
  )
}

function Updaters() {
  return (
    <>
      <ApplicationContextUpdater />
    </>
  )
}

// React 18: Use createRoot instead of render
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <ContextProviders>
      <Updaters />
      <ThemeProvider>
        <ApolloProvider client={client}>
          <AlertProvider template={AlertTemplate} {...alertOptions}>
            <App />
          </AlertProvider>
        </ApolloProvider>
      </ThemeProvider>
    </ContextProviders>
  </React.StrictMode>
)
