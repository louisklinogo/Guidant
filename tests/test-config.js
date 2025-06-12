/**
 * Test Configuration
 * Configures test environment to avoid API rate limiting and external dependencies
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GUIDANT_TEST_MODE = 'true';
process.env.GUIDANT_TEST_RATE_LIMIT = 'true'; // Enable rate limiting instead of disabling AI
process.env.GUIDANT_TEST_TIMEOUT = '30000'; // Longer timeouts for rate-limited requests

// Import rate limiter for AI calls
import { setupTestRateLimiting, withRateLimit } from './test-rate-limiter.js';

// Setup rate limiting for tests
const rateLimiter = setupTestRateLimiting();

// Mock AI response for fallback when rate limited
const mockAIResponse = {
  success: true,
  data: {
    insights: ['Mock insight 1', 'Mock insight 2'],
    analysis: 'Mock analysis result',
    recommendations: ['Mock recommendation']
  },
  metadata: {
    provider: 'mock',
    model: 'test-model',
    tokens: 100,
    rateLimited: false
  }
};

// Wrap fetch with rate limiting for AI API calls
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  // Detect AI provider from URL
  let provider = 'default';
  if (url.includes('openrouter.ai')) provider = 'openrouter';
  else if (url.includes('anthropic.com')) provider = 'anthropic';
  else if (url.includes('perplexity.ai')) provider = 'perplexity';
  else if (url.includes('mistral.ai')) provider = 'mistral';

  // Use rate limiting for AI API calls
  if (provider !== 'default') {
    return await withRateLimit(async () => {
      return await originalFetch(url, options);
    }, provider);
  }

  // For non-AI calls, use original fetch
  return await originalFetch(url, options);
};

// Increase timeouts for rate-limited tests
const originalSetTimeout = global.setTimeout;
global.setTimeout = (fn, delay) => {
  // For test timeouts, use longer delays to accommodate rate limiting
  if (process.env.GUIDANT_TEST_RATE_LIMIT === 'true') {
    const minDelay = 1000; // Minimum 1 second for rate-limited tests
    const testDelay = Math.max(delay, minDelay);
    return originalSetTimeout(fn, testDelay);
  }
  return originalSetTimeout(fn, delay);
};

// Mock file system operations that might fail
import fs from 'fs/promises';
const originalReadFile = fs.readFile;

fs.readFile = async (path, options) => {
  try {
    return await originalReadFile(path, options);
  } catch (error) {
    if (error.code === 'ENOENT' && path.includes('.guidant')) {
      // Return mock data for missing Guidant files
      if (path.includes('config.json')) {
        return JSON.stringify({
          name: 'Test Project',
          type: 'web_app',
          version: '1.0.0'
        });
      }
      if (path.includes('phases.json')) {
        return JSON.stringify({
          current: 'requirements',
          phases: {
            concept: { status: 'completed' },
            requirements: { status: 'in_progress' }
          }
        });
      }
    }
    throw error;
  }
};

console.log('🧪 Test configuration loaded - AI calls rate limited, timeouts increased for stability');

export default {
  testMode: true,
  rateLimitAI: true,
  enableAI: true, // AI is enabled but rate limited
  mockResponses: {
    ai: mockAIResponse
  },
  rateLimiter
};
