/**
 * Profile Validation Utilities
 * Validates user profile data before saving
 */

export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  bio: {
    minLength: 10,
    maxLength: 500
  },
  expertise: {
    minItems: 1,
    maxItems: 10,
    itemMaxLength: 30
  },
  hourlyRate: {
    min: 10,
    max: 1000
  }
}

export const validateProfileName = (name) => {
  if (!name) return 'Name is required'
  if (name.length < VALIDATION_RULES.name.minLength) {
    return `Name must be at least ${VALIDATION_RULES.name.minLength} characters`
  }
  if (name.length > VALIDATION_RULES.name.maxLength) {
    return `Name must be at most ${VALIDATION_RULES.name.maxLength} characters`
  }
  if (!VALIDATION_RULES.name.pattern.test(name)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }
  return null
}

export const validateProfileBio = (bio) => {
  if (!bio) return 'Bio is required'
  if (bio.length < VALIDATION_RULES.bio.minLength) {
    return `Bio must be at least ${VALIDATION_RULES.bio.minLength} characters`
  }
  if (bio.length > VALIDATION_RULES.bio.maxLength) {
    return `Bio must be at most ${VALIDATION_RULES.bio.maxLength} characters`
  }
  return null
}

export const validateExpertise = (expertise) => {
  if (!expertise || expertise.length === 0) {
    return `You must add at least ${VALIDATION_RULES.expertise.minItems} expertise area`
  }
  if (expertise.length > VALIDATION_RULES.expertise.maxItems) {
    return `You can add at most ${VALIDATION_RULES.expertise.maxItems} expertise areas`
  }
  for (const skill of expertise) {
    if (skill.length > VALIDATION_RULES.expertise.itemMaxLength) {
      return `Expertise tags must be at most ${VALIDATION_RULES.expertise.itemMaxLength} characters`
    }
  }
  return null
}

export const validateHourlyRate = (rate) => {
  if (!rate) return 'Hourly rate is required'
  const numRate = parseFloat(rate)
  if (isNaN(numRate)) return 'Hourly rate must be a number'
  if (numRate < VALIDATION_RULES.hourlyRate.min) {
    return `Hourly rate must be at least $${VALIDATION_RULES.hourlyRate.min}`
  }
  if (numRate > VALIDATION_RULES.hourlyRate.max) {
    return `Hourly rate must not exceed $${VALIDATION_RULES.hourlyRate.max}`
  }
  return null
}

export const validateSocialUrl = (url, type) => {
  if (!url) return null // Optional field
  
  const urlPattern = /^(https?:\/\/.+|[\w-]+)$/
  if (!urlPattern.test(url)) {
    return `Invalid ${type} URL`
  }
  return null
}

/**
 * Validate complete profile object
 */
export const validateProfile = (profile) => {
  const errors = {}

  if (profile.name !== undefined) {
    const nameError = validateProfileName(profile.name)
    if (nameError) errors.name = nameError
  }

  if (profile.bio !== undefined) {
    const bioError = validateProfileBio(profile.bio)
    if (bioError) errors.bio = bioError
  }

  if (profile.expertise !== undefined) {
    const expertiseError = validateExpertise(profile.expertise)
    if (expertiseError) errors.expertise = expertiseError
  }

  if (profile.hourlyRate !== undefined) {
    const rateError = validateHourlyRate(profile.hourlyRate)
    if (rateError) errors.hourlyRate = rateError
  }

  if (profile.social?.github) {
    const githubError = validateSocialUrl(profile.social.github, 'GitHub')
    if (githubError) errors.github = githubError
  }

  if (profile.social?.twitter) {
    const twitterError = validateSocialUrl(profile.social.twitter, 'Twitter')
    if (twitterError) errors.twitter = twitterError
  }

  if (profile.social?.website) {
    const websiteError = validateSocialUrl(profile.social.website, 'website')
    if (websiteError) errors.website = websiteError
  }

  return errors
}

export const hasErrors = (errorObject) => {
  return Object.keys(errorObject).length > 0
}
