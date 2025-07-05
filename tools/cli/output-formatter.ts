import chalk from 'chalk';
import { SearchResults } from './search-engine.js';

export class OutputFormatter {
  formatResults(query: string, results: SearchResults) {
    console.log(chalk.bold.cyan(`\n🔍 Searching for: "${query}"\n`));
    
    this.formatKaraokeResults(results.karaoke);
    this.formatLyricsResults(results.lyrics);
    
    // Add helpful message if no results found
    if (results.karaoke.length === 0 && results.lyrics.length === 0) {
      console.log(chalk.yellow('💡 Tip: Try different search terms or use English/Korean/Japanese variations of the song title.'));
      console.log(chalk.yellow('   Some services may have regional restrictions or require specific formatting.\n'));
    }
  }

  private formatKaraokeResults(results: any[]) {
    console.log(chalk.bold.yellow('\n🎤 Karaoke Song IDs:\n'));
    
    // Group results by source
    const resultsBySource = results.reduce((acc, result) => {
      if (!acc[result.source]) acc[result.source] = [];
      acc[result.source].push(result);
      return acc;
    }, {} as Record<string, any[]>);

    // Display TJ results
    if (resultsBySource.TJ?.length > 0) {
      console.log(chalk.bold('TJ Karaoke:'));
      resultsBySource.TJ.slice(0, 5).forEach((result: any) => {
        console.log(
          `  ${chalk.cyan(result.id)} - ${result.title}` +
          (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '')
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
          (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '')
        );
      });
    } else {
      console.log(chalk.gray('  No results from KY Karaoke'));
    }
  }

  private formatLyricsResults(results: any[]) {
    console.log(chalk.bold.yellow('\n📝 Lyrics Sources:\n'));
    
    // Group results by source
    const resultsBySource = results.reduce((acc, result) => {
      if (!acc[result.source]) acc[result.source] = [];
      acc[result.source].push(result);
      return acc;
    }, {} as Record<string, any[]>);

    // Display MusixMatch results
    if (resultsBySource.MusixMatch?.length > 0) {
      console.log(chalk.bold('MusixMatch:'));
      resultsBySource.MusixMatch.forEach((result: any) => {
        console.log(
          `  ${result.title}` +
          (result.artist ? ` ${chalk.gray(`by ${result.artist}`)}` : '') +
          `\n  ${chalk.blue.underline(result.url)}`
        );
      });
    } else {
      console.log(chalk.gray('  No results from MusixMatch'));
    }

    console.log();

    // Display Vocaro results
    if (resultsBySource.Vocaro?.length > 0) {
      console.log(chalk.bold('Vocaro Wiki:'));
      resultsBySource.Vocaro.forEach((result: any) => {
        let output = `  ${result.title}`;
        if (result.artist) {
          output += ` ${chalk.gray(`by ${result.artist}`)}`;
        }
        if (result.lyrics) {
          output += `\n  ${chalk.italic.gray(result.lyrics)}`;
        }
        output += `\n  ${chalk.blue.underline(result.url)}`;
        console.log(output);
      });
    } else {
      console.log(chalk.gray('  No results from Vocaro Wiki'));
    }

    console.log();
  }
} 
