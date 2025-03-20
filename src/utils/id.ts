export function generateCompactTimeId(): string {
  const BASE27_CHARSET = '0123456789bcdfghjklmnpqrstvwxyz'
  const BASE = BASE27_CHARSET.length // 27 characters
  const TARGET_ID_LENGTH = 13 // Fixed total length for the ID

  const timestamp = Date.now()

  // Convert timestamp to base27
  let timestampPart = ''
  let remaining = timestamp
  while (remaining > 0) {
    timestampPart = BASE27_CHARSET[remaining % BASE] + timestampPart
    remaining = Math.floor(remaining / BASE)
  }

  // Calculate how many random characters we need to reach target length
  const randomCharsNeeded = Math.max(0, TARGET_ID_LENGTH - timestampPart.length)

  // Generate random characters to fill the remaining space
  let randomPart = ''
  for (let i = 0; i < randomCharsNeeded; i++) {
    const randomIndex = Math.floor(Math.random() * BASE)
    randomPart += BASE27_CHARSET[randomIndex]
  }

  return `${timestampPart}${randomPart}`
}

export function generateFileSlug(suffix?: string) {
  const compactTimeId = generateCompactTimeId()
  return suffix ? `${compactTimeId}-${suffix}` : compactTimeId
}
