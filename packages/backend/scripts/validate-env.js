#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates that all required environment variables are set for the current environment
 * 
 * Usage:
 *   node scripts/validate-env.js
 *   node scripts/validate-env.js production
 *   node scripts/validate-env.js staging
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const env = process.env.NODE_ENV || process.argv[2] || 'development'

// Define required variables per environment
const requiredVars = {
  development: {
    core: ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET'],
    optional: ['LIVEKIT_URL', 'CERAMIC_URL', 'ETHEREUM_RPC_URL']
  },
  staging: {
    core: [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
      'WEB3_SIGNATURE_SALT',
      'LIVEKIT_API_KEY',
      'LIVEKIT_API_SECRET',
      'ETHEREUM_RPC_URL',
      'ARBITRUM_RPC_URL',
      'OPTIMISM_RPC_URL'
    ],
    optional: ['SENTRY_DSN', 'SENDGRID_API_KEY']
  },
  production: {
    core: [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
      'WEB3_SIGNATURE_SALT',
      'LIVEKIT_URL',
      'LIVEKIT_API_KEY',
      'LIVEKIT_API_SECRET',
      'CERAMIC_URL',
      'ETHEREUM_RPC_URL',
      'ARBITRUM_RPC_URL',
      'OPTIMISM_RPC_URL',
      'SENTRY_DSN'
    ],
    optional: ['SENDGRID_API_KEY', 'SLACK_WEBHOOK_URL']
  }
}

function validateEnvironment() {
  console.log(`\n🔍 Validating ${env} environment variables...\n`)

  const config = requiredVars[env] || requiredVars.development
  const { core, optional } = config

  let hasErrors = false
  let missingRequired = []
  let missingOptional = []

  // Check required variables
  for (const varName of core) {
    if (!process.env[varName]) {
      missingRequired.push(varName)
      hasErrors = true
    }
  }

  // Check optional variables
  for (const varName of optional) {
    if (!process.env[varName]) {
      missingOptional.push(varName)
    }
  }

  // Report results
  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingRequired.forEach(v => {
      console.error(`   - ${v}`)
    })
    console.error('')
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables:')
    missingOptional.forEach(v => {
      console.warn(`   - ${v}`)
    })
    console.warn('')
  }

  if (!hasErrors) {
    console.log('✅ All required environment variables are set\n')
    return 0
  } else {
    console.error('Please set all required environment variables before proceeding.\n')
    return 1
  }
}

const exitCode = validateEnvironment()
process.exit(exitCode)
