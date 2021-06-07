import nock from 'nock';
import path from 'path';
import { readFileSync } from 'fs';
import parser from '../src/parser';

const getFullPath = (name) => {
  const _dirname = process.cwd();
  return path.resolve(_dirname, '__tests__/fixtures', name);
};

const fixtures = {
  rss: null,
  rssWrong: null,
  rssResult: null,
};

beforeAll(() => {
  const rssWrongPath = getFullPath('wrongRss.xml');
  fixtures.rssWrong = readFileSync(rssWrongPath, 'utf8');
  const rssPath = getFullPath('rss.xml');
  fixtures.rss = readFileSync(rssPath, 'utf8');
  const rssResultPath = getFullPath('rss.json');
  const resultJson = readFileSync(rssResultPath, 'utf8');
  fixtures.rssResult = JSON.parse(resultJson);
});

test('perser', () => {
  const result = parser(fixtures.rss);
  expect(result).toEqual(fixtures.rssResult);
});

test('error network', () => {
  expect(() => {
    parser(fixtures.rssWrong);
  }).toThrow(/^errors.noValidRss$/);
});

nock.disableNetConnect();


nock.enableNetConnect();

