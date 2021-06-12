import nock from 'nock';
import { screen, getByLabelText, getByText } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import app from '../src/app';
// import path from 'path';
// import { readFileSync } from 'fs';
// import parser from '../src/parser';

const rss = 'https://ru.hexlet.io/lessons.rss';

beforeEach(() => {
  app();
});

test('testing form', () => {
  screen.debug();
  const submit = screen.getByLabelText('add');
  const input = getByLabelText(screen, 'url');
  input.value = rss;
  submit.click();
  expect(getByText('RSS успешно загружен'));
});

// const getFullPath = (name) => {
//   const dirname = process.cwd();
//   return path.resolve(dirname, '__tests__/fixtures', name);
// };

// const fixtures = {
//   rss: null,
//   rssWrong: null,
//   rssResult: null,
// };
//
// beforeAll(() => {
//   const rssWrongPath = getFullPath('wrongRss.xml');
//   fixtures.rssWrong = readFileSync(rssWrongPath, 'utf8');
//   const rssPath = getFullPath('rss.xml');
//   fixtures.rss = readFileSync(rssPath, 'utf8');
//   const rssResultPath = getFullPath('rss.json');
//   const resultJson = readFileSync(rssResultPath, 'utf8');
//   fixtures.rssResult = JSON.parse(resultJson);
// });
//
// test('perser', () => {
//   const result = parser(fixtures.rss);
//   expect(result).toEqual(fixtures.rssResult);
// });
//
// test('error network', () => {
//   expect(() => {
//     parser(fixtures.rssWrong);
//   }).toThrow(/^errors.noValidRss$/);
// });

// nock.disableNetConnect();

// nock.enableNetConnect();
