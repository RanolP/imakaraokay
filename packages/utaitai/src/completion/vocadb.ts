import ky from "ky";

export interface VocadbCompletionOptions {
  query: string;
}

export async function completeVocadb({ query }: VocadbCompletionOptions): Promise<string[]> {
  const url = new URL('https://vocadb.net/api/entries/names');
  url.searchParams.set('query', query);

  const response = await ky.get(url).json();
  if (!Array.isArray(response)) throw new Error('Invalid response');

  return response;
}
