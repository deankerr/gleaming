/**
 * Configuration options for the FetchService
 */
export interface FetchServiceConfig {
  /** List of blocked domains */
  blockedDomains?: string[]
  /** Fetch timeout in milliseconds */
  fetchTimeout?: number
  /** Maximum number of redirects to follow */
  maxRedirects?: number
  /** User agent string to use for requests */
  userAgent?: string
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  /** Default fetch timeout in milliseconds (30 seconds) */
  FETCH_TIMEOUT: 30000,
  /** Default maximum number of redirects to follow */
  MAX_REDIRECTS: 5,
  /** Default user agent string */
  USER_AGENT: 'Gleaming/1.0',
} as const

/**
 * Enhanced response type that includes metadata
 */
export interface EnhancedResponse extends Response {
  info: {
    url: URL
    timing: number
    contentLength?: string
    contentType?: string
    contentLanguage?: string
    contentDisposition?: string
    contentEncoding?: string
  }
}

/**
 * Service for fetching URLs with rate limiting and security
 */
export class FetchService {
  private rateLimiter: RateLimit
  private config: Required<FetchServiceConfig>
  private serviceHostname: string

  constructor(rateLimiter: RateLimit, serviceHostname: string, config: FetchServiceConfig = {}) {
    this.rateLimiter = rateLimiter
    this.serviceHostname = serviceHostname.toLowerCase()
    this.config = {
      fetchTimeout: DEFAULT_CONFIG.FETCH_TIMEOUT,
      maxRedirects: DEFAULT_CONFIG.MAX_REDIRECTS,
      userAgent: DEFAULT_CONFIG.USER_AGENT,
      blockedDomains: [],
      ...config,
    }
  }

  /**
   * Parse a URL string into a URL object
   * @throws Error if URL is invalid
   */
  private parseUrl(input: string | URL): URL {
    if (input instanceof URL) {
      return input
    }

    try {
      return new URL(input)
    }
    catch {
      throw new Error('Invalid URL format')
    }
  }

  /**
   * Verify if a URL is safe to fetch from
   * @throws Error if URL is not safe
   */
  public verifyUrl(input: string | URL): URL {
    const url = this.parseUrl(input)

    // Check protocol (only allow http and https)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`Unsupported URL protocol: ${url.protocol}`)
    }

    const hostname = url.hostname.toLowerCase()

    // Block our own service hostname
    if (hostname === this.serviceHostname) {
      throw new Error('Cannot fetch from our own service')
    }

    // Block localhost and private IPs
    if (
      hostname === 'localhost'
      || hostname === '127.0.0.1'
      || /^(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\./.test(hostname)
    ) {
      throw new Error('Internal/private URLs are not allowed')
    }

    // Check against blocklist
    if (this.config.blockedDomains.some(blocked => hostname.includes(blocked.toLowerCase()))) {
      throw new Error('URL domain is not allowed')
    }

    return url
  }

  /**
   * Main fetch method with rate limiting and timeout
   */
  async fetch(input: string | URL, options: RequestInit = {}): Promise<EnhancedResponse> {
    const startTime = Date.now()

    // Parse and validate URL - this will throw if invalid
    const url = this.verifyUrl(input)

    // Check rate limit using Cloudflare's rate limiter
    const ratelimit = await this.rateLimiter.limit({
      key: url.hostname,
    })

    if (!ratelimit.success) {
      throw new Error(`Rate limit exceeded for domain: ${url.hostname}`)
    }

    // Set up timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.fetchTimeout)

    try {
      // Execute fetch with our configuration
      const response = await fetch(url.toString(), {
        ...options,
        signal: controller.signal,
        redirect: 'follow',
        cf: {
          timeout: this.config.fetchTimeout / 1000,
          maxRedirects: this.config.maxRedirects,
        },
        headers: {
          'User-Agent': this.config.userAgent,
          ...options.headers,
        },
      })

      if (response.redirected)
        this.verifyUrl(response.url)

      // Return enhanced response with metadata
      return Object.assign(response.clone(), {
        info: {
          url,
          timing: Date.now() - startTime,
          contentLength: response.headers.get('content-length') || undefined,
          contentType: response.headers.get('content-type') || undefined,
          contentLanguage: response.headers.get('content-language') || undefined,
          contentDisposition: response.headers.get('content-disposition') || undefined,
          contentEncoding: response.headers.get('content-encoding') || undefined,
        },
      })
    }
    catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.fetchTimeout}ms`)
      }
      throw error
    }
    finally {
      clearTimeout(timeoutId)
    }
  }
}
