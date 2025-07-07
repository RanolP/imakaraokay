import ky from "ky";

export interface VocadbSearchOptions {
  query: string;
}

export async function* searchVocadb({ query }: VocadbSearchOptions): AsyncGenerator<VocadbSearchResponse> {
  "https://vocadb.net/api/entries/?start=0&getTotalCount=false&maxResults=2&query=%EA%B7%B8%EA%B2%83%EC%9D%B4+%EB%8B%B9%EC%8B%A0%EC%9D%98+%ED%96%89%EB%B3%B5%EC%9D%B4%EB%9D%BC+%ED%95%A0%EC%A7%80%EB%9D%BC%EB%8F%84&lang=Default&nameMatchMode=Auto"
  const url = new URL('https://vocadb.net/api/entries/');
  url.searchParams.set('query', query);
  url.searchParams.set('getTotalCount', 'true');
  url.searchParams.set('query', query)
  url.searchParams.set('lang', 'Default');
  url.searchParams.set('nameMatchMode', 'Auto');

  let count = 0;
  let totalCount = 1;

  do {
    url.searchParams.set('start', count.toString());
    const response = await ky.get(url).json<{
      totalCount: number;
      items: Array<{
        id: number;
        name: string;
      }>
    }>();

    for (const result of response.items) {
      yield {
        ...result,
        getDetail: () => ky.get(new URL(`https://vocadb.net/api/songs/${result.id}/details`)).json<VocadbSearchDetailResponse>(),
      };
    }

    count += response.items.length;
    totalCount = response.totalCount;
  } while (count < totalCount);
}
export interface VocadbSearchResponse {
  id: number;
  name: string;

  getDetail(): Promise<VocadbSearchDetailResponse>;
}
export interface VocadbSearchDetailResponse {
  additionalNames: string;
  artists: Array<{
    artist: {
      additionalNames: string;
      artistType: string;
      id: number;
      name: string;
    }
    categories: string;
    name: string;
  }>
  artistString: string;
  createDate: string;
  tags: Array<{
    additionalNames: string;
    categoryName: string;
    id: number;
    name: string;
    urlSlug: string;
  }>
}
