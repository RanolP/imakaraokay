import ky from 'ky';
import * as cheerio from 'cheerio';

namespace Internal {
  export const SearchType = Object.freeze({
    TITLE: 1,
  });
  export const SortType = Object.freeze({
    SONG_ID: 'pro',
    TITLE: 'indexTitle',
    SINGER: 'indexSong',
    LYRICIST: 'word',
    COMPOSER: 'com',
  });
  export const SortDirection = Object.freeze({
    ASC: 'ASC',
    DESC: 'DESC',
  });
}

export interface TjSearchOptions {
  query: string;
}
export async function* searchTJ({ query }: TjSearchOptions): AsyncGenerator<TjResponse> {
  const url = new URL(
    'https://www.tjmedia.com/song/accompaniment_search?pageNo=1&pageRowCnt=15&nationType=&strType=0&searchTxt=%EC%83%A4%EB%A5%BC',
  );
  url.searchParams.set('strType', Internal.SearchType.TITLE.toString());

  url.searchParams.set('strSotrGubun', Internal.SortDirection.ASC);
  url.searchParams.set('strSortType', Internal.SortType.TITLE);

  url.searchParams.set('searchTxt', query);

  url.searchParams.set('pageRowCnt', (15).toString());

  let pageNo = 1;
  let hasNext = true;

  do {
    url.searchParams.set('pageNo', pageNo.toString());
    const response = await ky.get(url).text();
    const $ = cheerio.load(response);

    const rows = $('.chart-list-area > li > ul:not(.top)');
    for (const row of rows) {
      const id = Number($(row).find('.mo-title ~ span').text());
      if (!Number.isInteger(id)) {
        throw new Error(`Got invalid ID: ${id}`);
      }
      const tags = $(row)
        .find('.title3 ul > li')
        .toArray()
        .map((li) => $(li).text().trim());
      const title = $(row)
        .find('.title3 p > span')
        .children()
        .toArray()
        .map((child) => ({
          content: $(child).text().trim(),
          highlight: $(child).hasClass('highlight'),
        }));
      const singer = $(row).find('.title4 p > span').text().trim();
      const lyricist = $(row).find('.title5 p > span').text().trim();
      const composer = $(row).find('.title6 p > span').text().trim();
      const youtube = $(row).find('.youtube > a').attr('href');

      yield {
        id,
        title,
        tags,
        singer,
        lyricist,
        composer,
        youtube,
      };
    }
    pageNo += 1;
    hasNext = rows.length > 0;
  } while (hasNext);
}
export interface TjResponse {
  id: number;
  title: Array<{ content: string; highlight: boolean }>;
  tags?: string[];
  singer: string;
  lyricist?: string;
  composer?: string;
  youtube?: string;
}
