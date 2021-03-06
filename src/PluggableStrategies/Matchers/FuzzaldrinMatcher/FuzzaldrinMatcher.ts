import {score} from 'fuzzaldrin-plus';
import {injectable} from 'inversify';
import {OptionsPanelType} from 'InjectableInterfaces/OptionsPanel';
import {StrategyName} from 'State/Interfaces';
import {EntryNode} from 'State/PassEntries/Interfaces';
import {createTypedMap, TypedMap} from 'State/Types/TypedMap';
import {Matcher} from '../';
import {OptionsPanel} from './OptionsPanel';

interface ScoredEntry {
  entry: EntryNode;
  score: number;
}

export interface Options {
  minScore: number;
  maxResults: number;
}

/**
 * these matches are not very good but it serves as a proof of concept
 */
@injectable()
export class FuzzaldrinMatcher extends Matcher<Options> {
  public static readonly URL_CLEAN_REGEX: RegExp = /^(http|ftp)s?:\/\//;
  public readonly name: StrategyName = 'FuzzaldrinMatcher';
  public readonly defaultOptions: TypedMap<Options> = createTypedMap({
    minScore: 1,
    maxResults: 20,
  });
  public readonly OptionsPanel: OptionsPanelType<Options> = OptionsPanel;

  public filterEntries(url: string, entries: EntryNode[]): EntryNode[] {
    url = url.replace(FuzzaldrinMatcher.URL_CLEAN_REGEX, '');
    const {maxResults, minScore} = this.options.toJS();

    const fuzzOptions = {
      pathSeparator: '/',
      allowErrors: true,
      isPath: true,
    };

    return entries
      .map((entry: EntryNode): ScoredEntry => {
        let accumulatedScore = 0;
        for (const part of entry.get('fullPath').split('/')) {
          accumulatedScore += score(url, part, void 0, fuzzOptions);
        }

        return {entry, score: accumulatedScore};
      })
      .sort((a: ScoredEntry, b: ScoredEntry) => b.score - a.score)
      .filter((value: ScoredEntry) => value.score >= minScore)
      .slice(0, maxResults > 0 ? maxResults : void 0)
      .map((entry: ScoredEntry) => entry.entry);
  }
}
