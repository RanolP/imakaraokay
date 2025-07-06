import * as cheerio from 'cheerio';
import ky from 'ky';

namespace Internal {
  export const SearchCategory = Object.freeze({
    TITLE: 2,
  });
}
export interface KySearchOptions {
  query: string;
}
export async function* searchKY({ query }: KySearchOptions): AsyncGenerator<KyResponse> {
  const url = new URL('https://kysing.kr/search/');
  url.searchParams.set('category', Internal.SearchCategory.TITLE.toString());
  url.searchParams.set('keyword', query);

  let page = 1;
  let hasNext = true;

  do {
    url.searchParams.set('s_page', page.toString());
    const response = await ky.get(url).text();
    const $ = cheerio.load(response);

    const rows = $('.search_chart_list');
    for (const row of rows) {
      const idRaw = $(row).find('li.search_chart_num').text().trim();
      const id = Number(idRaw);
      if (idRaw === '곡번호') {
        continue;
      }
      if (!Number.isInteger(id)) {
        throw new Error(`Got invalid ID: ${idRaw} (${id})`);
      }

      const title = $(row).find('li.search_chart_tit span.tit:not(.mo-art)').text().trim();
      const lyricCont = $(row).find('li.search_chart_tit .LyricsCont').text().trim();
      const singer = $(row).find('li.search_chart_sng').text().trim();
      const composer = $(row).find('li.search_chart_cmp').text().trim();
      const lyricist = $(row).find('li.search_chart_wrt').text().trim();
      const releaseDate = $(row).find('li.search_chart_rel').text().trim();
      const youtube = $(row).find('li.search_chart_ytb > a').attr('href');

      yield {
        id,
        title,
        lyricCont,
        singer,
        composer,
        lyricist,
        releaseDate,
        youtube,
      }
    }
    page += 1;
    hasNext = rows.length > 0;
  } while (hasNext)
}
export interface KyResponse {
  id: number;
  /**
   * 제목
   */
  title: string;
  /**
   * 가사
   */
  lyricCont: string;
  /**
   * 아티스트
   */
  singer: string;
  /**
   * 작곡가
   */
  composer: string;
  /**
   * 작사가
   */
  lyricist: string;
  /**
   * 출시일
   */
  releaseDate: string;
  /**
   * YOuTube 링크
   */
  youtube?: string;
}
