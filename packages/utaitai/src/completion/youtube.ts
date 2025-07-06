import ky from "ky";

export interface YouTubeCompletionOptions {
  query: string;
}
export async function completeYouTube({ query }: YouTubeCompletionOptions): Promise<string[]> {
  const url = new URL('https://suggestqueries.google.com/complete/search');
  url.searchParams.set('client', 'firefox');
  url.searchParams.set('ds', 'yt');
  url.searchParams.set('q', query);

  const data = await ky.get(url).json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid response format');
  }

  const suggestions = data[1];

  if (!Array.isArray(suggestions)) {
    throw new Error('Invalid response format');
  }

  return suggestions;
}
