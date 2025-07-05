# Karaoke Search CLI

A TypeScript CLI tool for searching karaoke song IDs and lyrics across multiple platforms.

## Features

- Search TJ Karaoke for song IDs
  - Simple text search - just type what you're looking for
  - Supports both Korean and English queries
- Search KY Karaoke (Keumyoung) for song IDs  
- Search MusixMatch for lyrics links
- Search Vocaro Wiki (Vocaloid lyrics) for lyrics
- Parallel search across all platforms
- Colored output for better readability
- Verbose mode for debugging

## Installation

Make sure you have the required dependencies installed:

```bash
pnpm install
```

## Usage

### Using pnpm script

```bash
# Basic search
pnpm run search "song title"

# With verbose mode
pnpm run search "song title" -- --verbose
# or
pnpm run search "song title" -- -v

# Help
pnpm run search -- --help
```

### Direct execution

```bash
# Basic search
pnpm exec tsx scripts/karaoke-search-cli.ts "song title"

# With verbose mode  
pnpm exec tsx scripts/karaoke-search-cli.ts -v "song title"

# Help
pnpm exec tsx scripts/karaoke-search-cli.ts --help
```

### Examples

```bash
# Search for songs or artists - it searches both
pnpm run search "좋은날"
pnpm run search "Blueming"
pnpm run search "IU"
pnpm run search "아이유"
pnpm run search "BTS"

# Verbose mode to see what's happening
pnpm exec tsx scripts/karaoke-search-cli.ts -v "Blueming"
```

### Working Example Output

```
# Searching for "Blueming":
🎤 Karaoke Song IDs:

TJ Karaoke:
  24518 - Blueming by IU
  62742 - Blueming by IU

# Searching for "IU" (returns songs by IU):
TJ Karaoke:
  85842 - Love wins all by IU
  87810 - Never Ending Story by IU
  33393 - 좋은날 by IU
  33962 - 내손을잡아(최고의사랑OST) by IU
  ... and more
```

## Output

The script displays results in the following format:

- **Karaoke Song IDs**: Shows TJ and KY karaoke system IDs with song titles and artists
- **Lyrics Sources**: Shows links to MusixMatch and Vocaro Wiki for lyrics

## Technical Details

### Dependencies

- `undici`: Modern HTTP client for Node.js
- `cheerio`: jQuery-like server-side DOM manipulation
- `chalk`: Terminal string styling

### Search Strategies

1. **TJ Karaoke**: Uses GET request to TJ Media website (https://www.tjmedia.com) - Working ✅
   - URL parameters:
     - `strType=1`: Song title search mode
     - `pageRowCnt=50`: Returns up to 50 results
     - Simple and predictable - just enter what you're looking for
2. **KY Karaoke**: Uses GET request to kysing.kr website - Partial ⚠️
   - URL: `https://kysing.kr/search/?category=2&keyword=QUERY&s_page=1`
   - May return some results mixed with page content (needs refinement)
3. **MusixMatch**: Scrapes search results page (may need updates)
4. **Vocaro Wiki**: Uses Wikidot's search functionality

### Error Handling

- Network timeouts set to 10 seconds
- Graceful failure for individual services
- Verbose mode shows detailed error information

## Limitations

- Some services may have regional restrictions
- Web scraping may break if websites change their structure
- Results limited to top 5 per service to avoid overwhelming output
- Some searches may require specific formatting (e.g., artist name first)

## Troubleshooting

1. **No results found**
   - Try different variations of the song title
   - Use both Korean and English names
   - Try searching with just the song title without artist

2. **Network errors**
   - Check your internet connection
   - Some services may be blocked in your region
   - Try using verbose mode to see detailed errors

3. **Partial results**
   - It's normal for some services to return no results
   - Each service has different databases and coverage

## Future Improvements

- Add more karaoke services (Joysound, DAM)
- Cache results to avoid repeated searches
- Export results to JSON/CSV
- Add proxy support for regional restrictions
- Implement retry logic for failed requests 
