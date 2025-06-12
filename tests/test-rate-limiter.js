/**
 * Test Rate Limiter
 * Handles AI API rate limiting during tests with intelligent delays
 */

class TestRateLimiter {
  constructor() {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.resetTime = Date.now();
    this.delays = {
      openrouter: 2000,    // 2 seconds between OpenRouter requests
      anthropic: 1500,     // 1.5 seconds between Anthropic requests
      perplexity: 3000,    // 3 seconds between Perplexity requests
      mistral: 1000,       // 1 second between Mistral requests
      default: 2000        // Default 2 seconds
    };
    this.maxRequestsPerMinute = 10;
  }

  /**
   * Wait for appropriate delay before making AI request
   * @param {string} provider - AI provider name
   * @returns {Promise<void>}
   */
  async waitForRequest(provider = 'default') {
    const now = Date.now();
    const delay = this.delays[provider] || this.delays.default;
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset counter every minute
    if (now - this.resetTime > 60000) {
      this.requestCount = 0;
      this.resetTime = now;
    }

    // Check if we're hitting rate limits
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.resetTime);
      console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.resetTime = Date.now();
    }

    // Wait for minimum delay between requests
    if (timeSinceLastRequest < delay) {
      const waitTime = delay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms for ${provider}...`);
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Handle 429 rate limit response with exponential backoff
   * @param {number} attempt - Current attempt number
   * @param {string} provider - AI provider name
   * @returns {Promise<void>}
   */
  async handleRateLimit(attempt = 1, provider = 'default') {
    const baseDelay = this.delays[provider] || this.delays.default;
    const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
    const maxDelay = 30000; // Max 30 seconds
    const actualDelay = Math.min(backoffDelay, maxDelay);

    console.log(`🚫 Rate limited (attempt ${attempt}), waiting ${actualDelay}ms...`);
    await this.sleep(actualDelay);
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   * @returns {Object} Status information
   */
  getStatus() {
    const now = Date.now();
    return {
      requestCount: this.requestCount,
      timeSinceReset: now - this.resetTime,
      timeSinceLastRequest: now - this.lastRequestTime,
      canMakeRequest: (now - this.lastRequestTime) >= this.delays.default
    };
  }
}

// Global rate limiter instance
const rateLimiter = new TestRateLimiter();

/**
 * Wrap AI API calls with rate limiting
 * @param {Function} apiCall - The API call function
 * @param {string} provider - Provider name
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>} API response
 */
export async function withRateLimit(apiCall, provider = 'default', maxRetries = 3) {
  let attempt = 1;
  
  while (attempt <= maxRetries) {
    try {
      // Wait for rate limit before making request
      await rateLimiter.waitForRequest(provider);
      
      // Make the API call
      const result = await apiCall();
      
      // If successful, return result
      return result;
      
    } catch (error) {
      // Handle rate limiting errors
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        if (attempt < maxRetries) {
          await rateLimiter.handleRateLimit(attempt, provider);
          attempt++;
          continue;
        } else {
          console.warn(`❌ Max retries reached for ${provider}, falling back to mock response`);
          return createMockResponse(provider);
        }
      }
      
      // Handle other errors
      if (error.message?.includes('timeout') || error.message?.includes('ECONNRESET')) {
        if (attempt < maxRetries) {
          console.log(`🔄 Network error, retrying in ${attempt * 1000}ms...`);
          await rateLimiter.sleep(attempt * 1000);
          attempt++;
          continue;
        }
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
}

/**
 * Create mock response for fallback
 * @param {string} provider - Provider name
 * @returns {Object} Mock response
 */
function createMockResponse(provider) {
  return {
    success: true,
    data: {
      insights: [`Mock insight from ${provider}`, 'Rate limited - using fallback'],
      analysis: `Mock analysis result (${provider} rate limited)`,
      recommendations: ['Use rate limiting in production', 'Consider caching responses']
    },
    metadata: {
      provider: `${provider}-mock`,
      model: 'test-fallback',
      tokens: 50,
      rateLimited: true
    }
  };
}

/**
 * Configure test environment with rate limiting
 */
export function setupTestRateLimiting() {
  // Set test mode to enable rate limiting
  process.env.GUIDANT_TEST_RATE_LIMIT = 'true';
  
  console.log('🧪 Test rate limiting enabled');
  console.log('⏳ AI requests will be delayed to avoid rate limits');
  
  return rateLimiter;
}

/**
 * Get rate limiter status for debugging
 */
export function getRateLimiterStatus() {
  return rateLimiter.getStatus();
}

export default rateLimiter;
