import type { APIRoute } from 'astro';
import * as cheerio from 'cheerio';

interface KaraokeResult {
  id: string;
  title: string;
  artist?: string;
  source: 'TJ' | 'KY';
}

interface ExternalSearchResult {
  query: string;
  results: KaraokeResult[];
  success: boolean;
  error?: string;
}

// Helper function for safe fetch with proper headers
async function safeFetch(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    return response;
  } catch (error) {
    throw new Error(`Fetch failed: ${error}`);
  }
}

// Search TJ Karaoke using the same logic as CLI
async function searchTJKaraoke(query: string): Promise<KaraokeResult[]> {
  const results: KaraokeResult[] = [];
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.tjmedia.com/song/accompaniment_search?pageNo=1&pageRowCnt=20&strSotrGubun=ASC&strSortType=&nationType=&strType=1&searchTxt=${encodedQuery}`;
    
    const response = await safeFetch(searchUrl);
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
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
          return;
        }
        
        // Extract song number
        const idMatch = fullText.match(/곡번호(\d+)/);
        if (!idMatch) return;
        
        const id = idMatch[1];
        if (processedIds.has(id)) return;
        
        // Find the song title and artist
        let remainingText = fullText.substring(fullText.indexOf(id) + id.length).trim();
        
        // Clean up MV/MR markers
        remainingText = remainingText.replace(/\s*(MV|MR)\s*/g, ' ').trim();
        
        // Split by whitespace and filter empty strings
        const parts = remainingText.split(/\s+/).filter(p => p.length > 0);
        
        if (parts.length >= 2) {
          const title = parts[0];
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
    }
  } catch (error) {
    console.error('TJ search error:', error);
  }
  
  return results.slice(0, 10); // Limit results
}

// Search KY Karaoke using the same logic as CLI
async function searchKYKaraoke(query: string): Promise<KaraokeResult[]> {
  const results: KaraokeResult[] = [];
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://kysing.kr/search/?category=2&keyword=${encodedQuery}&s_page=1`;
    
    const response = await safeFetch(searchUrl);
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Parse KY search results
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
        
        // Skip if this contains multiple song numbers
        const numberMatches = fullText.match(/\d{5,6}/g);
        if (!numberMatches || numberMatches.length > 1) return;
        
        // Look for KY song number pattern
        const idMatch = fullText.match(/(\d{5,6})/);
        if (!idMatch) return;
        
        const id = idMatch[1];
        if (processedIds.has(id)) return;
        
        // Extract title and artist
        let remainingText = fullText.replace(id, '').trim();
        remainingText = remainingText.replace(/^[-\s]+|[\s]+$/g, '');
        
        let title = '';
        let artist = '';
        
        if (remainingText.includes(' - ')) {
          const parts = remainingText.split(' - ');
          title = parts[0].trim();
          artist = parts[1] ? parts[1].trim() : '';
        } else if (remainingText.includes('  ')) {
          const parts = remainingText.split(/\s{2,}/);
          title = parts[0].trim();
          artist = parts[1] ? parts[1].trim() : '';
        } else {
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
    }
  } catch (error) {
    console.error('KY search error:', error);
  }
  
  return results.slice(0, 10); // Limit results
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter is required',
        query: '',
        results: []
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Search both TJ and KY in parallel
    const [tjResults, kyResults] = await Promise.all([
      searchTJKaraoke(query),
      searchKYKaraoke(query)
    ]);

    const allResults = [...tjResults, ...kyResults];

    const response: ExternalSearchResult = {
      query,
      results: allResults,
      success: true
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('External search API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      query: '',
      results: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 
