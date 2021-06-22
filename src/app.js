import * as yup from 'yup';
import axios from 'axios';
import {
  uniqueId, has, differenceBy, find, size,
} from 'lodash';

import i18n from 'i18next';
import language from './language/index';
import initView from './view';
import parse from './parser';

const timeRepeatUpdateMs = 5000;
const schemaRss = yup.string().required().trim().url();

const validateUrl = (url, rssUrls = []) => {
  try {
    schemaRss.notOneOf(rssUrls).validateSync(url);
    return null;
  } catch (e) {
    return e;
  }
};

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', true);
  return urlWithProxy.toString();
};

function getErrorType(e) {
  console.log(32, JSON.stringify(e));
  if (e.isAxiosError) {
    return 'errors.network';
  }
  if (e.isParsingError) {
    return 'errors.noValidRss';
  }
  return 'errors.default';
}

const getRss = (url) => {
  const urlWithProxy = addProxy(url);
  return axios.get(urlWithProxy).then((resp) => resp.data.contents);
};

function updateRss(watchedState) {
  const promises = watchedState.feeds.map((feed) => getRss(feed.url)
    .then((resp) => {
      const data = parse(resp);
      const updatedItems = data.items.map((item) => {
        const id = uniqueId();
        return {
          ...item,
          feedId: feed.id,
          id,
        };
      }, []);
      const oldItems = watchedState.posts.filter((post) => post.feedId === feed.id);
      const newItems = differenceBy(updatedItems, oldItems, 'title');
      if (size(newItems) > 0) {
        watchedState.posts.unshift(...newItems);
      }
    })
    .catch((error) => {
      console.error = error;
    }));

  Promise.all(promises).finally(() => {
    setTimeout(() => {
      updateRss(watchedState);
    }, timeRepeatUpdateMs);
  });
}

function submitHandler(watchedState, form) {
  const formData = new FormData(form);
  const url = formData.get('url');
  const rssUrls = watchedState.feeds.map((feed) => feed.url);
  const error = validateUrl(url, rssUrls);
  if (error) {
    const errorMessageKey = `form.errors.${error.type}`;
    // eslint-disable-next-line no-param-reassign
    watchedState.form.fields.url = {
      valid: false,
      error: errorMessageKey,
    };
    return;
  }
  // eslint-disable-next-line no-param-reassign
  watchedState.form.fields.url = {
    valid: true,
    error: null,
  };
  // eslint-disable-next-line no-param-reassign
  watchedState.form.status = 'getting';

  getRss(url)
    .then((resp) => {
      const data = parse(resp);
      const id = uniqueId();
      const feed = {
        title: data.title,
        description: data.description,
        link: data.link,
        url,
        id,
      };
      const items = data.items.map((item) => ({
        ...item,
        feedId: id,
        id: uniqueId(),
      }));
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...items);
      // eslint-disable-next-line no-param-reassign
      watchedState.form.status = 'success';
      // eslint-disable-next-line no-param-reassign
      watchedState.form.status = 'filling';
    })
    .catch((e) => {
      console.log(121, e);
      // eslint-disable-next-line no-param-reassign
      watchedState.error = getErrorType(e);
      // eslint-disable-next-line no-param-reassign
      watchedState.form.status = 'failed';
    });
}

function app() {
  const i18next = i18n.createInstance();
  i18next
    .init({
      lng: 'ru',
      resources: language,
      debug: true,
    })
    .then(() => {
      const elements = {
        formContainer: document.querySelector('.rss-form'),
        submit: document.querySelector('#submit'),
        input: document.querySelector('#form-url'),
        feedsContainer: document.querySelector('.feeds'),
        postsContainer: document.querySelector('.posts'),
        feedback: document.querySelector('[data-feedback-message]'),
        modal: {
          container: document.querySelector('.modal'),
          title: document.querySelector('[data-modal-label]'),
          content: document.querySelector('.modal-body'),
          link: document.querySelector('[data-modal-link]'),
        },
      };
      const state = {
        form: {
          status: 'filling', // filling, getting, failed, success
          fields: {
            url: {
              valid: true,
              error: null,
            },
          },
        },
        modal: {
          post: null,
        },
        feeds: [],
        posts: [],
        error: null,
        ui: {
          seenPosts: new Set(),
        },
      };

      const watchedState = initView(state, elements, i18next);

      elements.formContainer.addEventListener('submit', (event) => {
        event.preventDefault();
        submitHandler(watchedState, event.currentTarget);
      });

      elements.postsContainer.addEventListener('click', (event) => {
        if (!has(event.target.dataset, 'postId')) {
          return;
        }

        const { postId } = event.target.dataset;
        const post = find(watchedState.posts, { id: postId });
        watchedState.ui.seenPosts.add(postId);
        watchedState.modal = {
          post,
        };
      });

      setTimeout(() => {
        updateRss(watchedState);
      }, timeRepeatUpdateMs);
    });
}

export default app;
