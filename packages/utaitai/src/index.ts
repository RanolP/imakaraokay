/**
 * Utaitai - A library for imakaraokay
 */

export * from './types.js';
export * from './utils.js';

// Version information
export const VERSION = '1.0.0';

// Main library initialization
export function initUtaitai() {
  console.log('Utaitai library initialized');
}

// Default export
export default {
  VERSION,
  initUtaitai,
}; 
