#!/usr/bin/env tsx

import { parseArgs } from 'node:util';
import { fetch } from 'undici';
import * as cheerio from 'cheerio';
import chalk from 'chalk';

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

Usage: tsx karaoke-search-cli.ts [options] <song title>

Options:
  -h, --help     Show this help message
  -v, --verbose  Show detailed search progress

Example:
  tsx karaoke-search-cli.ts "아이유 좋은날"
  tsx karaoke-search-cli.ts -v "Blueming"
  tsx karaoke-search-cli.ts "IU Blueming"
`);
  process.exit(0);
}

const songTitle = positionals.join(' ');
const verbose = values.verbose || false;

interface KaraokeResult {
  id: string;
  title: string;
  artist?: string;
  source: 'TJ' | 'KY';
}

interface LyricsResult {
  title: string;
  artist?: string;
  url: string;
  source: 'MusixMatch' | 'Vocaro';
}

// Helper function for logging in verbose mode
function log(message: string) {
  if (verbose) {
    console.log(chalk.gray(`[LOG] ${message}`));
  }
}

// Helper function to make fetch requests with better error handling
async function safeFetch(url: string, options?: any) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
        ...options?.headers,
      },
      timeout: 10000, // 10 second timeout
    });
    return response;
  } catch (error) {
    log(`Fetch error for ${url}: ${error}`);
    throw error;
  }
}

// Search TJ Karaoke with alternative approach
async function searchTJKaraoke(query: string): Promise<KaraokeResult[]> {
  log(`Searching TJ Karaoke for: ${query}`);
  let results: KaraokeResult[] = [];
  
  try {
    // Use the working TJ Media website with full parameters
    // strType=1: song title search (but also finds songs when searching by artist)
    // pageRowCnt=50: get up to 50 results
    // strSotrGubun=ASC: ascending sort order
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.tjmedia.com/song/accompaniment_search?pageNo=1&pageRowCnt=50&strSotrGubun=ASC&strSortType=&nationType=&strType=1&searchTxt=${encodedQuery}`;
    
    log(`TJ search URL: ${searchUrl}`);
    
    const response = await safeFetch(searchUrl);
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Parse the song results from the TJ Media website
      // Looking for structure like: 곡번호24518 MV Blueming IU 아이유 이종훈,이채규,아이유
      
      // Find all elements containing song numbers
      const songElements = $('li, tr, div').filter((_, elem) => {
        const text = $(elem).text();
        return text.includes('곡번호') && /곡번호\d+/.test(text);
      });
      
      const processedIds = new Set<string>();
      
      songElements.each((_, elem) => {
        const $elem = $(elem);
        const fullText = $elem.text().trim();
        
        // Skip if this is a parent element containing already processed songs
        const songNumMatches = fullText.match(/곡번호(\d+)/g);
        if (songNumMatches && songNumMatches.length > 1) {
          return; // Skip parent elements containing multiple songs
        }
        
        // Extract song number
        const idMatch = fullText.match(/곡번호(\d+)/);
        if (!idMatch) return;
        
        const id = idMatch[1];
        if (processedIds.has(id)) return;
        
        // Find the song title and artist
        // The structure after 곡번호 can be: MV/MR Title Artist KoreanArtist Composers
        let remainingText = fullText.substring(fullText.indexOf(id) + id.length).trim();
        
        // Clean up MV/MR markers
        const hasMV = remainingText.includes('MV');
        const hasMR = remainingText.includes('MR');
        remainingText = remainingText.replace(/\s*(MV|MR)\s*/g, ' ').trim();
        
        // Split by whitespace and filter empty strings
        const parts = remainingText.split(/\s+/).filter(p => p.length > 0);
        
        if (parts.length >= 2) {
          // First non-MV/MR part is the title
          const title = parts[0];
          
          // Second part is usually the artist (English name)
          const artist = parts[1];
          
          // Check if this looks like a valid result
          if (title && artist && !title.includes('곡') && !artist.includes('작')) {
            processedIds.add(id);
            results.push({
              id,
              title,
              artist,
              source: 'TJ'
            });
          }
        }
      });
      
      // Limit results to avoid duplicates
      results = results.reduce((acc, curr) => {
        const exists = acc.find(r => r.id === curr.id);
        if (!exists) acc.push(curr);
        return acc;
      }, [] as KaraokeResult[]);
    }
    
    log(`Found ${results.length} results from TJ Karaoke`);
  } catch (error) {
    log(`Error searching TJ Karaoke: ${error}`);
    console.error(chalk.red('Failed to search TJ Karaoke'));
  }
  
  return results;
}

// Search KY Karaoke using kysing.kr
async function searchKYKaraoke(query: string): Promise<KaraokeResult[]> {
  log(`Searching KY Karaoke for: ${query}`);
  let results: KaraokeResult[] = [];
  
  try {
    // Use the working KY singing website
    // category=2: song search (based on the URL pattern)
    // s_page=1: first page of results
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://kysing.kr/search/?category=2&keyword=${encodedQuery}&s_page=1`;
    
    log(`KY search URL: ${searchUrl}`);
    
    const response = await safeFetch(searchUrl);
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Parse KY search results - look for actual song entries
      // Filter out navigation and UI elements
      const songElements = $('*').filter((_, elem) => {
        const text = $(elem).text().trim();
        const hasNumber = /\d{5,6}/.test(text);
        const isNavigation = text.includes('콘텐츠로') || text.includes('고객센터') || 
                           text.includes('메뉴') || text.includes('검색') ||
                           text.includes('로그인') || text.includes('회원가입') ||
                           text.length < 5;
        
        return hasNumber && !isNavigation && text.length > 10;
      });
      
      const processedIds = new Set<string>();
      
      songElements.each((_, elem) => {
        const $elem = $(elem);
        const fullText = $elem.text().trim();
        
        // Skip if this contains multiple song numbers (likely a parent element)
        const numberMatches = fullText.match(/\d{5,6}/g);
        if (!numberMatches || numberMatches.length > 1) return;
        
        // Look for KY song number pattern (usually 5-6 digits)
        const idMatch = fullText.match(/(\d{5,6})/);
        if (!idMatch) return;
        
        const id = idMatch[1];
        if (processedIds.has(id)) return;
        
        // Extract title and artist - remove the ID first
        let remainingText = fullText.replace(id, '').trim();
        
        // Clean up common prefixes/suffixes
        remainingText = remainingText.replace(/^[-\s]+|[\s]+$/g, '');
        
        // Try different splitting patterns for KY format
        let title = '';
        let artist = '';
        
        // Pattern 1: "Title - Artist" or "Title Artist"
        if (remainingText.includes(' - ')) {
          const parts = remainingText.split(' - ');
          title = parts[0].trim();
          artist = parts[1] ? parts[1].trim() : '';
        } else if (remainingText.includes('  ')) {
          // Pattern 2: "Title  Artist" (double space)
          const parts = remainingText.split(/\s{2,}/);
          title = parts[0].trim();
          artist = parts[1] ? parts[1].trim() : '';
        } else {
          // Pattern 3: Just take the remaining text as title
          const words = remainingText.split(/\s+/);
          if (words.length >= 2) {
            title = words[0];
            artist = words.slice(1).join(' ');
          } else {
            title = remainingText;
          }
        }
        
        // Validate the extracted data
        if (title && title.length > 0 && 
            !title.includes('KYSing') && 
            !title.includes('고객') &&
            !title.includes('센터') &&
            !/^\d+$/.test(title)) {
          
          processedIds.add(id);
          results.push({
            id,
            title,
            artist: artist || undefined,
            source: 'KY'
          });
        }
      });
      
      // Deduplicate results
      results = results.reduce((acc, curr) => {
        const exists = acc.find(r => r.id === curr.id);
        if (!exists) acc.push(curr);
        return acc;
      }, [] as KaraokeResult[]);
    }
    
    log(`Found ${results.length} results from KY Karaoke`);
  } catch (error) {
    log(`Error searching KY Karaoke: ${error}`);
    console.error(chalk.red('Failed to search KY Karaoke'));
  }
  
  return results;
}

// Search MusixMatch for lyrics
async function searchMusixMatch(query: string): Promise<LyricsResult[]> {
  log(`Searching MusixMatch for: ${query}`);
  const results: LyricsResult[] = [];
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.musixmatch.com/search/${encodedQuery}/tracks`;
    
    const response = await safeFetch(searchUrl);
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Try multiple selectors
      $('.track-list__item, .media-card, .track-card').each((index, elem) => {
        if (index >= 5) return; // Limit to 5 results
        
        const titleElem = $(elem).find('.track-name, .title, h2');
        const artistElem = $(elem).find('.artist-name, .artist, h3');
        const linkElem = $(elem).find('a[href*="/lyrics/"]').first();
        
        const title = titleElem.text().trim();
        const artist = artistElem.text().trim();
        const href = linkElem.attr('href');
        
        if (title && href) {
          results.push({
            title,
            artist: artist || undefined,
            url: href.startsWith('http') ? href : `https://www.musixmatch.com${href}`,
            source: 'MusixMatch'
          });
        }
      });
      
      // If no results found with specific selectors, try a more general approach
      if (results.length === 0) {
        $('a[href*="/lyrics/"]').each((index, elem) => {
          if (index >= 5) return;
          
          const $elem = $(elem);
          const href = $elem.attr('href');
          const text = $elem.text().trim();
          
          if (href && text && text.length > 0) {
            results.push({
              title: text,
              url: `https://www.musixmatch.com${href}`,
              source: 'MusixMatch'
            });
          }
        });
      }
    }
    
    log(`Found ${results.length} results from MusixMatch`);
  } catch (error) {
    log(`Error searching MusixMatch: ${error}`);
    console.error(chalk.red('Failed to search MusixMatch'));
  }
  
  return results.slice(0, 5);
}

// Search Vocaro Wiki for lyrics
async function searchVocaro(query: string): Promise<LyricsResult[]> {
  log(`Searching Vocaro Wiki for: ${query}`);
  const results: LyricsResult[] = [];
  
  try {
    // Try the main page search first
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `http://vocaro.wikidot.com/search:site/q/${encodedQuery}`;
    
    const response = await safeFetch(searchUrl);
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Parse search results
      $('.search-results .w-item, .list-pages-item').each((index, item) => {
        if (index >= 5) return;
        
        const $item = $(item);
        const titleLink = $item.find('.title a, h1 a, a').first();
        const title = titleLink.text().trim() || $item.find('.w-title').text().trim();
        const href = titleLink.attr('href');
        
        if (title && href) {
          results.push({
            title,
            url: href.startsWith('http') ? href : `http://vocaro.wikidot.com${href}`,
            source: 'Vocaro'
          });
        }
      });
      
      // If no results, try alternative selectors
      if (results.length === 0) {
        $('a[href^="/"], a[href*="vocaro"]').each((index, elem) => {
          if (index >= 10) return;
          
          const $elem = $(elem);
          const href = $elem.attr('href');
          const text = $elem.text().trim();
          
          // Filter out navigation links
          if (href && text && text.length > 3 && 
              !href.includes('/forum/') && 
              !href.includes('/system:') &&
              !text.includes('전체') &&
              !text.includes('목록')) {
            results.push({
              title: text,
              url: href.startsWith('http') ? href : `http://vocaro.wikidot.com${href}`,
              source: 'Vocaro'
            });
          }
        });
      }
    }
    
    log(`Found ${results.length} results from Vocaro Wiki`);
  } catch (error) {
    log(`Error searching Vocaro Wiki: ${error}`);
    console.error(chalk.red('Failed to search Vocaro Wiki'));
  }
  
  return results.slice(0, 5);
}

// Main search function
async function searchAll(query: string) {
  console.log(chalk.bold.cyan(`\n🔍 Searching for: "${query}"\n`));
  
  // Search all sources in parallel
  const [tjResults, kyResults, musixMatchResults, vocaroResults] = await Promise.all([
    searchTJKaraoke(query),
    searchKYKaraoke(query),
    searchMusixMatch(query),
    searchVocaro(query)
  ]);
  
  // Display Karaoke results
  console.log(chalk.bold.yellow('\n🎤 Karaoke Song IDs:\n'));
  
  if (tjResults.length > 0) {
    console.log(chalk.bold('TJ Karaoke:'));
    tjResults.slice(0, 5).forEach(result => {
      console.log(
        `  ${chalk.cyan(result.id)} - ${result.title}` +
        (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '')
      );
    });
  } else {
    console.log(chalk.gray('  No results from TJ Karaoke'));
  }
  
  console.log();
  
  if (kyResults.length > 0) {
    console.log(chalk.bold('KY Karaoke:'));
    kyResults.slice(0, 5).forEach(result => {
      console.log(
        `  ${chalk.magenta(result.id)} - ${result.title}` +
        (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '')
      );
    });
  } else {
    console.log(chalk.gray('  No results from KY Karaoke'));
  }
  
  // Display Lyrics results
  console.log(chalk.bold.yellow('\n📝 Lyrics Sources:\n'));
  
  if (musixMatchResults.length > 0) {
    console.log(chalk.bold('MusixMatch:'));
    musixMatchResults.forEach(result => {
      console.log(
        `  ${result.title}` +
        (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '') +
        `\n  ${chalk.blue.underline(result.url)}`
      );
    });
  } else {
    console.log(chalk.gray('  No results from MusixMatch'));
  }
  
  console.log();
  
  if (vocaroResults.length > 0) {
    console.log(chalk.bold('Vocaro Wiki:'));
    vocaroResults.forEach(result => {
      console.log(
        `  ${result.title}\n  ${chalk.blue.underline(result.url)}`
      );
    });
  } else {
    console.log(chalk.gray('  No results from Vocaro Wiki'));
  }
  
  console.log();
  
  // Add helpful message if no results found
  if (tjResults.length === 0 && kyResults.length === 0 && 
      musixMatchResults.length === 0 && vocaroResults.length === 0) {
    console.log(chalk.yellow('💡 Tip: Try different search terms or use English/Korean/Japanese variations of the song title.'));
    console.log(chalk.yellow('   Some services may have regional restrictions or require specific formatting.\n'));
  }
}

// Run the search
searchAll(songTitle).catch(error => {
  console.error(chalk.red('An error occurred:'), error);
  process.exit(1);
}); 
