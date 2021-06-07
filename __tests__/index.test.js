import nock from 'nock';
import path from 'path';
import { readFileSync } from 'fs';
import parser from '../src/parser';
import initApp from '../src/app';

const getFullPath = (name) => {
  const __dirname = process.cwd();
  return path.resolve(__dirname, '__tests__/fixtures', name);
};

let rss, rssWrong, rssResult;

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

// test('error network', () => {
//   const app = initApp();
//   const urlEl = document.querySelector('[name="url"]');
//   const submitEl = document.getElementById('submit');
//   console.log(urlEl);
//   urlEl.value = 'https://ru.hexlet.io/lessons.rss';
//   expect(submitEl.click()).toThrowError(/^errors.network$/);
// });

nock.enableNetConnect();

