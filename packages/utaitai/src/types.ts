/**
 * Type definitions for Utaitai library
 */

export interface UtaitaiConfig {
  debug?: boolean;
  apiKey?: string;
}

export interface UtaitaiResult {
  success: boolean;
  data?: any;
  error?: string;
}

export type UtaitaiStatus = 'idle' | 'loading' | 'success' | 'error'; 
