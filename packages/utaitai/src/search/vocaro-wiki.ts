import { search } from 'google-sr';

export interface VocaroWikiSearchOptions {
  query: string;
}

export async function* searchVocaroWiki({ query }: VocaroWikiSearchOptions): AsyncGenerator<VocaroWikiResponse> {
  for (const result of await search({
    query: [
      'site:vocaro.wikidot.com',
      '"출처"',
      JSON.stringify(query),
    ].join(' '),
  })) {
    if (result.title == null || result.link == null) continue;
    const url = new URL(result.link);
    if (url.pathname.startsWith('/artist:') || url.pathname.startsWith('/album:')) continue;
    yield {
      url: result.link,
      title: result.title,
      description: result.description ?? undefined,
    }
  }
}

export interface VocaroWikiResponse {
  url: string;
  title: string;
  description?: string;
}
