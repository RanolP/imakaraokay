#!/usr/bin/env tsx

import { parseArgs } from 'node:util';
import chalk from 'chalk';

import { Logger } from '../utils/logger.js';
import { SearchEngine } from '../search/search-engine.js';
import { OutputFormatter } from '../search/output-formatter.js';

// Import providers
import { TJKaraokeProvider } from '../providers/tj-karaoke-provider.js';
import { KYKaraokeProvider } from '../providers/ky-karaoke-provider.js';
import { MusixMatchProvider } from '../providers/musixmatch-provider.js';
import { VocaroProvider } from '../providers/vocaro-provider.js';

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: {
      type: 'boolean',
      short: 'h',
    },
    verbose: {
      type: 'boolean',
      short: 'v',
    },
  },
  allowPositionals: true,
});

if (values.help || positionals.length === 0) {
  console.log(`
${chalk.bold('Karaoke Song Search CLI')}

Usage: tsx karaoke-search-cli-refactored.ts [options] <song title>

Options:
  -h, --help     Show this help message
  -v, --verbose  Show detailed search progress

Example:
  tsx karaoke-search-cli-refactored.ts "좋은날"
  tsx karaoke-search-cli-refactored.ts -v "Blueming"
  tsx karaoke-search-cli-refactored.ts "IU Blueming"
`);
  process.exit(0);
}

const songTitle = positionals.join(' ');
const verbose = values.verbose || false;

async function main() {
  try {
    // Initialize components
    const logger = new Logger(verbose);
    const searchEngine = new SearchEngine(logger);
    const formatter = new OutputFormatter();

    // Register providers
    searchEngine.addKaraokeProvider(new TJKaraokeProvider(logger));
    searchEngine.addKaraokeProvider(new KYKaraokeProvider(logger));
    searchEngine.addLyricsProvider(new MusixMatchProvider(logger));
    searchEngine.addLyricsProvider(new VocaroProvider(logger));

    // Perform search
    const results = await searchEngine.search(songTitle);

    // Display results
    formatter.formatResults(songTitle, results);
    
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
    process.exit(1);
  }
}

main(); 
