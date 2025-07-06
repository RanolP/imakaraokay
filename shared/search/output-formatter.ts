import chalk from 'chalk';
import type { SearchResults } from './search-engine.js';
import type { EnhancedLyricsResult } from '../providers/vocaro-provider.js';

export class OutputFormatter {
  formatResults(query: string, results: SearchResults) {
    console.log(chalk.bold.cyan(`\n🔍 Searching for: "${query}"\n`));

    this.formatKaraokeResults(results.karaoke);
    this.formatLyricsResults(results.lyrics);

    // Add helpful message if no results found
    if (results.karaoke.length === 0 && results.lyrics.length === 0) {
      console.log(
        chalk.yellow(
          '💡 Tip: Try different search terms or use English/Korean/Japanese variations of the song title.',
        ),
      );
      console.log(
        chalk.yellow(
          '   Some services may have regional restrictions or require specific formatting.\n',
        ),
      );
    }
  }

  private formatKaraokeResults(results: any[]) {
    console.log(chalk.bold.yellow('\n🎤 Karaoke Song IDs:\n'));

    // Group results by source
    const resultsBySource = results.reduce(
      (acc, result) => {
        if (!acc[result.source]) acc[result.source] = [];
        acc[result.source].push(result);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Display TJ results
    if (resultsBySource.TJ?.length > 0) {
      console.log(chalk.bold('TJ Karaoke:'));
      resultsBySource.TJ.slice(0, 5).forEach((result: any) => {
        console.log(
          `  ${chalk.cyan(result.id)} - ${result.title}` +
            (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : ''),
        );
      });
    } else {
      console.log(chalk.gray('  No results from TJ Karaoke'));
    }

    console.log();

    // Display KY results
    if (resultsBySource.KY?.length > 0) {
      console.log(chalk.bold('KY Karaoke:'));
      resultsBySource.KY.slice(0, 5).forEach((result: any) => {
        console.log(
          `  ${chalk.magenta(result.id)} - ${result.title}` +
            (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : ''),
        );
      });
    } else {
      console.log(chalk.gray('  No results from KY Karaoke'));
    }
  }

  private formatLyricsResults(results: any[]) {
    console.log(chalk.bold.yellow('\n📝 Lyrics Sources:\n'));

    // Group results by source
    const resultsBySource = results.reduce(
      (acc, result) => {
        if (!acc[result.source]) acc[result.source] = [];
        acc[result.source].push(result);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Display MusixMatch results
    if (resultsBySource.MusixMatch?.length > 0) {
      console.log(chalk.bold('MusixMatch:'));
      resultsBySource.MusixMatch.forEach((result: any) => {
        console.log(
          `  ${result.title}` +
            (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '') +
            `\n  ${chalk.blue.underline(result.url)}`,
        );
      });
    } else {
      console.log(chalk.gray('  No results from MusixMatch'));
    }

    console.log();

    // Display Vocaro results with enhanced information
    if (resultsBySource.Vocaro?.length > 0) {
      console.log(chalk.bold('Vocaro Wiki:'));
      resultsBySource.Vocaro.forEach((result: any) => {
        this.formatVocaroResult(result);
      });
    } else {
      console.log(chalk.gray('  No results from Vocaro Wiki'));
    }

    console.log();
  }

  private formatVocaroResult(result: any) {
    const enhanced = result as EnhancedLyricsResult;

    let output = `  ${enhanced.title}`;
    if (enhanced.artist) {
      output += ` ${chalk.gray(`by ${enhanced.artist}`)}`;
    }

    // Display Japanese title if available
    if (enhanced.japaneseTitle) {
      output += `\n  ${chalk.green('Japanese:')} ${enhanced.japaneseTitle}`;
    }

    // Display lyrics preview if available
    if (enhanced.lyrics) {
      output += `\n  ${chalk.italic.gray(enhanced.lyrics)}`;
    }

    // Display karaoke results if available
    if (enhanced.karaokeResults && enhanced.karaokeResults.length > 0) {
      output += `\n  ${chalk.yellow('🎤 Karaoke IDs found:')}`;

      // Group karaoke results by source
      const karaokeBySource = enhanced.karaokeResults.reduce(
        (acc, kr) => {
          if (!acc[kr.source]) acc[kr.source] = [];
          acc[kr.source].push(kr);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      // Display TJ karaoke results
      if (karaokeBySource.TJ) {
        karaokeBySource.TJ.slice(0, 3).forEach((kr) => {
          output += `\n    ${chalk.cyan('TJ')} ${chalk.cyan(kr.id)} - ${kr.title}`;
          if (kr.artist) output += ` ${chalk.gray(`by ${kr.artist}`)}`;
        });
      }

      // Display KY karaoke results
      if (karaokeBySource.KY) {
        karaokeBySource.KY.slice(0, 3).forEach((kr) => {
          output += `\n    ${chalk.magenta('KY')} ${chalk.magenta(kr.id)} - ${kr.title}`;
          if (kr.artist) output += ` ${chalk.gray(`by ${kr.artist}`)}`;
        });
      }
    }

    output += `\n  ${chalk.blue.underline(enhanced.url)}`;
    console.log(output);
  }
}
