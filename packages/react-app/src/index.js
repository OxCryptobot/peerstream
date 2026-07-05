import React from 'react'
import ReactDOM from 'react-dom/client'
import { ethers } from 'ethers'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { NetworkContextName } from './constants'
import ThemeProvider from './theme'
import { types, transitions, positions, Provider as AlertProvider } from 'react-alert'
import AlertTemplate from 'react-alert-template-basic'
import App from './pages/App'
import './index.css'

import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TokensContextProvider, { Updater as TokensContextUpdater } from './contexts/Tokens'

require('./App.css')

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

function getLibrary(provider) {
  const library = new ethers.BrowserProvider(provider)
  library.pollingInterval = 10000
  return library
}

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
    <ApplicationContextProvider>
      <TokensContextProvider>
        {children}
      </TokensContextProvider>
    </ApplicationContextProvider>
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
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
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
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </React.StrictMode>
)
