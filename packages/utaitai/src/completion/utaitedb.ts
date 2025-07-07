import ky from "ky";

export interface UtaitedbCompletionOptions {
  query: string;
}

export async function completeUtaitedb({ query }: UtaitedbCompletionOptions): Promise<string[]> {
  const url = new URL('https://utaitedb.net/api/entries/names');
  url.searchParams.set('query', query);

  const response = await ky.get(url).json();
  if (!Array.isArray(response)) throw new Error('Invalid response');

  return response;
}
