import QuestionProvider from '../providers/QuestionProvider.js';
import { createTtlCache } from '../../../utils/ttlCache.js';
import { createRateLimiter } from '../../../utils/rateLimiter.js';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const USER_AGENT = 'QuizDuel/1.0 (https://localhost)';

const cache = createTtlCache(60 * 60 * 1000);
const rateLimit = createRateLimiter({ intervalMs: 1000, max: 1 });

const fetchSparql = async (query) => {
  await rateLimit();
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
    },
  });
  if (!response.ok) {
    throw new Error('Wikidata request failed');
  }
  return response.json();
};

const fetchSummary = async (title) => {
  await rateLimit();
  const response = await fetch(`${WIKIPEDIA_SUMMARY}${encodeURIComponent(title)}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (!data.extract) {
    return null;
  }
  return data.extract.length > 240 ? `${data.extract.slice(0, 237)}...` : data.extract;
};

const pickOptions = (countries, correct) => {
  const options = new Set([correct]);
  while (options.size < 4 && countries.length > 0) {
    const option = countries[Math.floor(Math.random() * countries.length)];
    options.add(option);
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
};

export default class WikidataTemplateQuestionProvider extends QuestionProvider {
  constructor() {
    super('WIKIDATA');
  }

  async getQuestion() {
    const cached = cache.get('cities');
    let rows = cached;
    if (!rows) {
      const query = `
        SELECT ?city ?cityLabel ?countryLabel ?article WHERE {
          ?city wdt:P31/wdt:P279* wd:Q515;
                wdt:P17 ?country.
          ?article schema:about ?city;
                   schema:isPartOf <https://en.wikipedia.org/>.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 50
      `;
      const data = await fetchSparql(query);
      rows = data.results.bindings.map((row) => ({
        city: row.cityLabel.value,
        country: row.countryLabel.value,
        article: row.article.value,
      }));
      cache.set('cities', rows);
    }

    const countries = [...new Set(rows.map((row) => row.country))];

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const pick = rows[Math.floor(Math.random() * rows.length)];
      const title = decodeURIComponent(pick.article.split('/wiki/')[1] || '');
      const snippet = await fetchSummary(title);
      if (!snippet) {
        continue;
      }

      const options = pickOptions(countries.filter((c) => c !== pick.country), pick.country);
      return {
        type: 'MCQ',
        prompt: `Which country is ${pick.city} located in?`,
        options,
        answer: pick.country,
        difficulty: 'MEDIUM',
        negativeMarking: false,
        citations: [
          {
            url: pick.article,
            evidenceSnippet: snippet,
            sourceType: 'WIKIPEDIA',
          },
        ],
        provider: this.name,
      };
    }

    throw new Error('Unable to build Wikidata question');
  }
}
