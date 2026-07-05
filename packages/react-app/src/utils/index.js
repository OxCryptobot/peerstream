import { ethers } from 'ethers'
import { addresses, abis } from "@sablier-app/contracts"
import UncheckedJsonRpcSigner from './signer'

export const ERROR_CODES = ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOKEN_DECIMALS'].reduce(
  (accumulator, currentValue, currentIndex) => {
    accumulator[currentValue] = currentIndex
    return accumulator
  }, {}
)

export function safeAccess(object, path) {
  return object
    ? path.reduce(
        (accumulator, currentValue) => (accumulator && accumulator[currentValue] ? accumulator[currentValue] : null),
        object
      )
    : null
}

export function isAddress(value) {
  try {
    return ethers.getAddress(value)
  } catch {
    return false
  }
}

export async function getEvents(library, filter) {
  return library.getLogs(filter)
}

export function getProviderOrSigner(library, account) {
  return account ? new UncheckedJsonRpcSigner(library.getSigner(account)) : library
}

export function getContract(chainId, library, contractName, account) {
  switch (contractName) {
    case "Sablier":
      return new ethers.Contract(addresses[chainId].sablier, abis.sablier, getProviderOrSigner(library, account))
    default:
      return null
  }
}

export function getERC20Contract(address, library, account) {
  return new ethers.Contract(address, abis.erc20, getProviderOrSigner(library, account))
}

export async function getTokenName(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  try {
    const contract = new ethers.Contract(tokenAddress, abis.erc20, library)
    return await contract.name()
  } catch {
    try {
      const contractBytes32 = new ethers.Contract(tokenAddress, abis.erc20_bytes32, library)
      const bytes32 = await contractBytes32.name()
      return ethers.toUtf8String(bytes32)
    } catch (error) {
      error.code = ERROR_CODES.TOKEN_NAME
      throw error
    }
  }
}

export async function getStreamEventsBetween(chainId, library, sender, recipient, account) {
  const sablier = getContract(chainId, library, "Sablier", account)
  const filter = sablier.filters.CreateStream(null, sender, recipient)
  filter.fromBlock = 0
  filter.toBlock = "latest"
  return getEvents(library, filter)
}

export async function getStreamEventsTo(chainId, library, account) {
  const sablier = getContract(chainId, library, "Sablier", account)
  const filter = sablier.filters.CreateStream(null, null, account)
  filter.fromBlock = 0
  filter.toBlock = "latest"
  return getEvents(library, filter)
}

export async function getTokenSymbol(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  try {
    const contract = new ethers.Contract(tokenAddress, abis.erc20, library)
    return await contract.symbol()
  } catch {
    try {
      const contractBytes32 = new ethers.Contract(tokenAddress, abis.erc20_bytes32, library)
      const bytes32 = await contractBytes32.symbol()
      return ethers.toUtf8String(bytes32)
    } catch (error) {
      error.code = ERROR_CODES.TOKEN_SYMBOL
      throw error
    }
  }
}

// get token decimals
export async function getTokenDecimals(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, abis.erc20, library)
    .decimals()
    .catch(error => {
      error.code = ERROR_CODES.TOKEN_DECIMALS
      throw error
    })
}

export function shortenAddress(address, digits = 4) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, digits + 2)}...${address.substring(42 - digits)}`
}

export function shortenTransactionHash(hash, digits = 4) {
  return `${hash.substring(0, digits + 2)}...${hash.substring(66 - digits)}`
}

export function calculateGasMargin(value, margin) {
  const offset = (BigInt(value) * BigInt(margin)) / BigInt(10000)
  return BigInt(value) + offset
}

export function formatEthBalance(balance) {
  return amountFormatter(balance, 18, 6)
}

export function formatTokenBalance(balance, decimal) {
  return !!(balance && Number.isInteger(decimal)) ? amountFormatter(balance, decimal, Math.min(4, decimal)) : 0
}

// amount must be a BigNumber or BigInt, {base,display}Decimals must be Numbers
export function amountFormatter(amount, baseDecimals = 18, displayDecimals = 3, useLessThan = true) {
  if (baseDecimals > 18 || displayDecimals > 18 || displayDecimals > baseDecimals) {
    throw Error(`Invalid combination of baseDecimals '${baseDecimals}' and displayDecimals '${displayDecimals}.`)
  }

  // if balance is falsy, return undefined
  if (!amount) {
    return undefined
  }

  // Convert to BigInt if needed
  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount.toString ? amount.toString() : amount)
  
  // if amount is 0, return
  if (amountBigInt === 0n) {
    return '0'
  }
  // amount > 0
  else {
    // amount of 'wei' in 1 'ether'
    const baseAmount = 10n ** BigInt(baseDecimals)

    const minimumDisplayAmount = baseAmount / (10n ** BigInt(displayDecimals))

    // if balance is less than the minimum display amount
    if (amountBigInt < minimumDisplayAmount) {
      return useLessThan
        ? `<${ethers.formatUnits(minimumDisplayAmount, baseDecimals)}`
        : `${ethers.formatUnits(amountBigInt, baseDecimals)}`
    }
    // if the balance is greater than the minimum display amount
    else {
      const stringAmount = ethers.formatUnits(amountBigInt, baseDecimals)

      // if there isn't a decimal portion
      if (!stringAmount.match(/\./)) {
        return stringAmount
      }
      // if there is a decimal portion
      else {
        const [wholeComponent, decimalComponent] = stringAmount.split('.')
        const roundUpAmount = minimumDisplayAmount / 2n
        const paddedDecimal = decimalComponent.padEnd(baseDecimals, '0')
        const roundedDecimalComponent = (BigInt(paddedDecimal) + roundUpAmount)
          .toString()
          .padStart(baseDecimals, '0')
          .substring(0, displayDecimals)

        // decimals are too small to show
        if (roundedDecimalComponent === '0'.repeat(displayDecimals)) {
          return wholeComponent
        }
        // decimals are not too small to show
        else {
          return `${wholeComponent}.${roundedDecimalComponent.toString().replace(/0*$/, '')}`
        }
      }
    }
  }
}