import * as cheerio from 'cheerio';
import { safeFetch } from './fetch-utils.js';
import { Logger } from './logger.js';

export interface GoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export class GoogleSearchService {
  constructor(private logger: Logger) {}

  /**
   * Search Bing with domain filtering (more reliable than DuckDuckGo for HTML parsing)
   * @param query The search query
   * @param domain The domain to filter results to (e.g., 'vocaro.wikidot.com')
   * @param maxResults Maximum number of results to return (default: 5)
   */
  async searchWithDomainFilter(
    query: string, 
    domain: string, 
    maxResults: number = 5
  ): Promise<GoogleSearchResult[]> {
    this.logger.log(`Searching Bing for "${query}" on domain ${domain}`);
    
    const results: GoogleSearchResult[] = [];
    
    try {
      // Construct Bing search URL with site: operator for domain filtering
      const encodedQuery = encodeURIComponent(`${query} site:${domain}`);
      const searchUrl = `https://www.bing.com/search?q=${encodedQuery}&count=${Math.min(maxResults * 2, 20)}`;
      
      this.logger.log(`Bing search URL: ${searchUrl}`);
      
      const response = await safeFetch(searchUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Bing search failed with status: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Debug: Log some information about the page
      this.logger.log(`Bing page title: ${$('title').text()}`);
      this.logger.log(`Found ${$('a').length} total links on the page`);
      
      // Debug: Log domain-specific links found (only first few for brevity)
      const domainLinks = $(`a[href*="${domain}"]`);
      this.logger.log(`Found ${domainLinks.length} links containing domain ${domain}`);
      
      // Parse Bing search results
      // Bing has more reliable HTML structure than DuckDuckGo
      const selectors = [
        '.b_algo h2 a',                  // Bing main result titles
        '.b_title a',                    // Alternative Bing selector
        '.b_algo .b_title a',            // More specific Bing selector
        'h2 a[href*="' + domain + '"]',  // Generic approach for domain-specific links
        'a[href*="' + domain + '"]',     // Fallback: any link containing the domain
      ];
      
      let foundResults = false;
      
      for (const selector of selectors) {
        if (foundResults) break;
        
        $(selector).each((_, elem) => {
          if (results.length >= maxResults) return false;
          
          const $elem = $(elem);
          
          // For DuckDuckGo, the element itself is usually the link
          const title = $elem.text().trim();
          const href = $elem.attr('href');
          
          if (!title || !href) return;
          
          // Clean up Bing's redirect URLs
          let cleanUrl = href;
          if (href.startsWith('/aclk?') || href.includes('bing.com/ck/')) {
            // Bing redirect format: extract actual URL
            const urlMatch = href.match(/&u=([^&]+)/) || href.match(/url=([^&]+)/);
            if (urlMatch) {
              cleanUrl = decodeURIComponent(urlMatch[1]);
            }
          }
          
          // Skip Bing internal URLs
          if (cleanUrl.startsWith('/') || cleanUrl.includes('bing.com')) return;
          
          // Verify the URL is from the target domain
          if (!cleanUrl.includes(domain)) return;
          
          // Find the snippet/description for Bing
          const $resultContainer = $elem.closest('.b_algo, .b_caption');
          let snippet = '';
          
          // Try Bing snippet selectors
          const snippetSelectors = [
            '.b_caption p',         // Bing main snippet
            '.b_snippet',           // Alternative Bing snippet
            '.b_caption',           // Caption area
            '.b_descript',          // Description area
          ];
          
          for (const snippetSelector of snippetSelectors) {
            const $snippet = $resultContainer.find(snippetSelector).first();
            if ($snippet.length) {
              snippet = $snippet.text().trim();
              break;
            }
          }
          
          // If no snippet found, try to find any descriptive text
          if (!snippet) {
            $resultContainer.find('span, div').each((_, span) => {
              const text = $(span).text().trim();
              if (text.length > 50 && text.length < 300 && !text.includes('http')) {
                snippet = text;
                return false; // break
              }
            });
          }
          
          results.push({
            title,
            url: cleanUrl,
            snippet: snippet || 'No description available',
            domain: domain
          });
          
          foundResults = true;
        });
      }
      
      // If no results found with structured selectors, try a more general approach
      if (results.length === 0) {
        this.logger.log(`No results found with structured selectors, trying general approach`);
        $('a').each((_, elem) => {
          if (results.length >= maxResults) return false;
          
          const $elem = $(elem);
          const href = $elem.attr('href');
          const text = $elem.text().trim();
          
          if (!href || !text || text.length < 5) return;
          
          // Clean up Bing's redirect URLs
          let cleanUrl = href;
          if (href.startsWith('/aclk?') || href.includes('bing.com/ck/')) {
            // Bing redirect format: extract actual URL
            const urlMatch = href.match(/&u=([^&]+)/) || href.match(/url=([^&]+)/);
            if (urlMatch) {
              cleanUrl = decodeURIComponent(urlMatch[1]);
            }
          }
          
          // Skip Bing internal URLs
          if (cleanUrl.startsWith('/') || cleanUrl.includes('bing.com')) return;
          
          // Verify the URL is from the target domain and looks like a valid result
          if (cleanUrl.includes(domain)) {
            results.push({
              title: text,
              url: cleanUrl,
              snippet: 'Found via general search',
              domain: domain
            });
          }
        });
      }
      
      this.logger.log(`Found ${results.length} Bing search results for domain ${domain}`);
      
    } catch (error) {
      this.logger.log(`Error performing Bing search: ${error}`);
      throw error;
    }
    
    return results.slice(0, maxResults);
  }

  /**
   * Investigate a URL by fetching its content and extracting key information
   */
  async investigateUrl(url: string): Promise<{
    title: string;
    content: string;
    lyrics?: string;
    artist?: string;
    songTitle?: string;
    isValid: boolean;
  }> {
    this.logger.log(`Investigating URL: ${url}`);
    
    try {
      const response = await safeFetch(url);
      
      if (!response.ok) {
        return {
          title: 'Failed to load',
          content: `HTTP ${response.status}`,
          isValid: false
        };
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'No title found';
      
      // Extract main content
      let content = '';
      
      // Try to find the main content area
      const contentSelectors = [
        '#main-content',
        '.content',
        '#content',
        '.page-content',
        '.main',
        'main',
        'article'
      ];
      
      for (const selector of contentSelectors) {
        const $content = $(selector);
        if ($content.length) {
          content = $content.text().trim();
          break;
        }
      }
      
      // If no main content found, get body text but filter out navigation
      if (!content) {
        $('script, style, nav, header, footer, .nav, .menu').remove();
        content = $('body').text().trim();
      }
      
      // Clean up content (remove excessive whitespace)
      content = content.replace(/\s+/g, ' ').trim();
      
      // Try to extract lyrics-specific information
      let lyrics = '';
      let artist = '';
      let songTitle = '';
      
      // Look for lyrics patterns
      const lyricsSelectors = [
        '.lyrics',
        '#lyrics',
        '.song-lyrics',
        '.lyric-content',
        '.verse'
      ];
      
      for (const selector of lyricsSelectors) {
        const $lyrics = $(selector);
        if ($lyrics.length) {
          lyrics = $lyrics.text().trim();
          break;
        }
      }
      
      // Try to extract artist and song info from title or content
      const titleLower = title.toLowerCase();
      if (titleLower.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length >= 2) {
          songTitle = parts[0].trim();
          artist = parts[1].trim();
        }
      }
      
      // Check if this looks like a valid song/lyrics page
      const isValid = lyrics.length > 50 || 
                     content.toLowerCase().includes('lyrics') ||
                     content.toLowerCase().includes('가사') ||
                     title.toLowerCase().includes('lyrics') ||
                     title.toLowerCase().includes('가사');
      
      return {
        title,
        content: content.substring(0, 1000), // Limit content length
        lyrics: lyrics || undefined,
        artist: artist || undefined,
        songTitle: songTitle || undefined,
        isValid
      };
      
    } catch (error) {
      this.logger.log(`Error investigating URL ${url}: ${error}`);
      return {
        title: 'Investigation failed',
        content: `Error: ${error}`,
        isValid: false
      };
    }
  }
} 
