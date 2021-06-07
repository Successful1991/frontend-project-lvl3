import nock from 'nock';
import path from 'path';
import { readFileSync } from 'fs';
import parser from '../src/parser';

const getFullPath = (name) => {
  const _dirname = process.cwd();
  return path.resolve(_dirname, '__tests__/fixtures', name);
};

let rss;
let rssWrong;
let rssResult;

beforeAll(() => {
  const rssWrongPath = getFullPath('wrongRss.xml');
  rssWrong = readFileSync(rssWrongPath, 'utf8');
  const rssPath = getFullPath('rss.xml');
  rss = readFileSync(rssPath, 'utf8');
  const rssResultPath = getFullPath('rss.json');
  const resultJson = readFileSync(rssResultPath, 'utf8');
  rssResult = JSON.parse(resultJson);
});

test('perser', () => {
  const result = parser(rss);
  expect(result).toEqual(rssResult);
});

test('error network', () => {
  expect(() => {
    parser(rssWrong);
  }).toThrow(/^errors.noValidRss$/);
});

nock.disableNetConnect();


nock.enableNetConnect();

