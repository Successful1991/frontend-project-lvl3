// import nock from 'nock';
import '@testing-library/jest-dom';
import { screen, fireEvent, within } from '@testing-library/dom';
import path from 'path';
import { readFileSync } from 'fs';
import app from '../src/app';

const correctUrl = 'https://ru.hexlet.io/lessons.rss';
const urlUpdated = 'http://lorem-rss.herokuapp.com/feed?unit=second&interval=30';
const wrongUrl = 'hts://ru.hexlet.io/lessons.rss';
const invalidRssUrl = 'https://google.com';
const initHtml = readFileSync(path.resolve('index.html'), 'utf8').toString().trim();
let i18next = null;

beforeEach(() => {
  i18next = app();
  document.body.innerHTML = initHtml;
});

function sendUrl(url) {
  const submit = screen.getByRole('button', { name: /add/i });
  const input = screen.getByLabelText('url');
  input.value = url;
  fireEvent.click(submit);
  return { input, submit };
}

describe('form', () => {
  test('empty url', async () => {
    expect(screen.queryByText(/Не должно быть пустым/i)).not.toBeInTheDocument();
    sendUrl(' ');
    expect(await screen.findByText(/Не должно быть пустым/i)).toBeInTheDocument();
  });

  test('valid rss', async () => {
    expect(screen.queryByText(/RSS успешно загружен/i)).not.toBeInTheDocument();
    const { submit, input } = sendUrl(correctUrl);

    expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
    expect(input.value).toBe('');

    expect(screen.queryByText(/RSS уже существует/i)).not.toBeInTheDocument();
    input.value = correctUrl;
    fireEvent.click(submit);
    expect(await screen.findByText(/RSS уже существует/i)).toBeInTheDocument();
    expect(input.value).toBe(correctUrl);
  });

  test('wrong url', () => {
    sendUrl(wrongUrl);
    expect(screen.getByText(/Ссылка должна быть валидным URL/i)).toBeInTheDocument();
  });

  test('wrong rss', async () => {
    sendUrl(invalidRssUrl);
    expect(await screen.findByText(/Ресурс не содержит валидный RSS/i)).toBeInTheDocument();
  });

  test('add feeds', async () => {
    expect(screen.queryByText(i18next.t('feedsTitle'))).not.toBeInTheDocument();
    expect(screen.getByTestId('feeds')).toBeEmptyDOMElement();
    sendUrl(correctUrl);
    expect(await screen.findByText(i18next.t('feedsTitle'))).toBeInTheDocument();
    expect(screen.getByTestId('feeds')).not.toBeEmptyDOMElement();
    expect(screen.getByText(/RSS успешно загружен/i)).toBeInTheDocument();

    expect(screen.getByText(i18next.t('postsTitle'))).toBeInTheDocument();
    expect(screen.getByTestId('posts')).not.toBeEmptyDOMElement();

    const postContainer = screen.getByTestId('posts');
    const postsLength = within(postContainer).getAllByRole('listitem').length;

    sendUrl(urlUpdated);
    expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
    expect(within(screen.getByTestId('feeds')).getAllByRole('listitem')).toHaveLength(2);
    expect(within(postContainer).getAllByRole('listitem')).not.toHaveLength(postsLength);
  });

  test.todo('network');

  // nock.disableNetConnect();
  // test('network' , () => {
  //   const submit = screen.getByRole('button', { name: /add/i });
  //   const input = screen.getByLabelText('url');
  //   input.value = rss;
  //   fireEvent.click(submit);
  //   expect(screen.findByText(/Ошибка сети/i)).toBeInTheDocument();
  // });
  // nock.enableNetConnect();
});
