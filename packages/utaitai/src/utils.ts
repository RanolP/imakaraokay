/**
 * Utility functions for Utaitai library
 */

import type { UtaitaiConfig, UtaitaiResult } from './types.js';

/**
 * Create a default configuration
 */
export function createDefaultConfig(): UtaitaiConfig {
  return {
    debug: false,
    apiKey: undefined,
  };
}

/**
 * Create a success result
 */
export function createSuccessResult(data?: any): UtaitaiResult {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error result
 */
export function createErrorResult(error: string): UtaitaiResult {
  return {
    success: false,
    error,
  };
}

/**
 * Log debug information if debug mode is enabled
 */
export function debugLog(config: UtaitaiConfig, message: string, ...args: any[]): void {
  if (config.debug) {
    console.log(`[Utaitai Debug] ${message}`, ...args);
  }
} 
