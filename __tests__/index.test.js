import { app, getRss } from '../src/app';
import i18next from 'i18next';
import nock from 'nock';


nock.disableNetConnect();

const link = 'https://ru.hexlet.io/lessons.rss';
const wrongLink = 'th the following optio';

// beforeAll(() => {
  // get fixtures
  // app();
// });
test('empty test', () => {
  // expect(app()).toBeTruthy();
});

// test('getRss disableNetConnect', async () => {
//   expect(await getRss(link)).toThrow('Ошибка сети');
// });

// test('getRss wrong link', () => {
//   const scope = nock('https://ru.hexlet.io')
//     .get('/lessons.rss')
//     .reply(200, []);
//   await getRss(link);
//   expect(scope).toThrow(i18next.t('errors.network'));
// });

nock.enableNetConnect();


