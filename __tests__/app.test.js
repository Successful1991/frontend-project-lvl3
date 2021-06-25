import nock from 'nock';
import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event/dist';
import path from 'path';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import { readFileSync } from 'fs';
import app from '../src/app';

const getFixturesPath = (file) => path.resolve('__tests__', 'fixtures', file);
const rssUrl = 'https://ru.hexlet.io/lessons.rss';
const initHtml = readFileSync(path.resolve('index.html'), 'utf8');
const validRss1 = readFileSync(getFixturesPath('rss.xml'), 'utf8');
const validRss2 = readFileSync(getFixturesPath('rss2.xml'), 'utf8');
const noValidRss = readFileSync(getFixturesPath('rssNoValid.xml'), 'utf8');

axios.defaults.adapter = httpAdapter;

beforeEach(async () => {
  document.body.innerHTML = initHtml;
  await app();
});

function sendUrl(url) {
  const submit = screen.getByRole('button', { name: /add/i });
  const input = screen.getByLabelText('url');
  userEvent.paste(input, url);
  userEvent.click(submit);
  return { input, submit };
}

function nockUrl(url, data) {
  nock('https://hexlet-allorigins.herokuapp.com').get('/get')
    .query({ url, disableCache: 'true' }).reply(200, data);
}

nock.disableNetConnect();

test('empty url', async () => {
  expect(screen.queryByText(/Не должно быть пустым/i)).not.toBeInTheDocument();
  sendUrl(' ');
  expect(await screen.findByText(/Не должно быть пустым/i)).toBeInTheDocument();
});

test('exists url', async () => {
  nockUrl(rssUrl, { contents: validRss1 });
  expect(screen.queryByText(/RSS успешно загружен/i)).not.toBeInTheDocument();
  const { submit, input } = sendUrl(rssUrl);

  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
  expect(input.value).toBe('');
  expect(screen.queryByText(/RSS уже существует/i)).not.toBeInTheDocument();
  userEvent.paste(input, rssUrl);
  userEvent.click(submit);

  expect(await screen.findByText(/RSS уже существует/i)).toBeInTheDocument();
  expect(input.value).toBe(rssUrl);
});

test('wrong url', () => {
  sendUrl('hts://ru.hexlet.io/lessons.rss');
  expect(screen.getByText(/Ссылка должна быть валидным URL/i)).toBeInTheDocument();
});

test('wrong rss', async () => {
  nockUrl('https://pannellum.org/documentation/examples/simple-example/', noValidRss);
  sendUrl('https://pannellum.org/documentation/examples/simple-example/');
  expect(await screen.findByText(/Ресурс не содержит валидный RSS/i)).toBeInTheDocument();
});

test('add feeds', async () => {
  nockUrl(rssUrl, { contents: validRss1 });
  nockUrl('http://lorem-rss.herokuapp.com/feed?unit=second&interval=30', { contents: validRss2 });

  expect(screen.queryByText(/Фиды/)).not.toBeInTheDocument();
  expect(screen.getByTestId('feeds')).toBeEmptyDOMElement();
  sendUrl(rssUrl);
  expect(await screen.findByText(/Фиды/)).toBeInTheDocument();
  expect(screen.getByTestId('feeds')).not.toBeEmptyDOMElement();
  expect(screen.getByText(/RSS успешно загружен/i)).toBeInTheDocument();

  expect(screen.getByText(/Посты/)).toBeInTheDocument();
  expect(screen.getByTestId('posts')).not.toBeEmptyDOMElement();

  const postContainer = screen.getByTestId('posts');
  const postsLength = within(postContainer).getAllByRole('listitem').length;

  sendUrl('http://lorem-rss.herokuapp.com/feed?unit=second&interval=30');
  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
  expect(within(screen.getByTestId('feeds')).getAllByRole('listitem')).toHaveLength(2);
  expect(within(postContainer).getAllByRole('listitem')).not.toHaveLength(postsLength);
});

// test.todo('network');
test('network', async () => {
  nock('https://hexlet-allorigins.herokuapp.com').get('/get')
    .query({ rssUrl, disableCache: 'true' }).replyWithError('Network Error');

  const submit = screen.getByRole('button', { name: /add/i });
  const input = screen.getByLabelText('url');
  userEvent.paste(input, rssUrl);
  userEvent.click(submit);
  expect(await screen.findByText(/Ошибка сети/i)).toBeInTheDocument();
});

nock.enableNetConnect();
