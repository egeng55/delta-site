/**
 * Centralized API Configuration
 *
 * All API URLs should be imported from here to ensure consistency.
 * In development, these can be overridden with environment variables.
 */

// Delta Backend API (deployed on Render)
export const DELTA_API_URL = process.env.NEXT_PUBLIC_DELTA_API_URL || 'https://delta-80ht.onrender.com';

// Timeout for initial requests (Render free tier may need to wake up)
export const API_COLD_START_TIMEOUT = 30000; // 30 seconds for cold start
export const API_NORMAL_TIMEOUT = 10000; // 10 seconds for warm requests

/**
 * Fetch with timeout and retry logic for Render cold starts
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeout = API_COLD_START_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // If we have retries left and it's a timeout/network error, retry
    if (retries > 0 && (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch')))) {
      console.log(`Request failed, retrying... (${retries} retries left)`);
      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
      return fetchWithRetry(url, options, retries - 1, API_NORMAL_TIMEOUT);
    }

    throw error;
  }
}

/**
 * Check if the backend is likely sleeping (Render free tier)
 */
export function isLikelyRenderColdStart(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}
