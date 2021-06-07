import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';

import i18n from 'i18next';
import ru from './language/ru';
import initView from './view';
import parse from './parser';

const timeRepeatUpdateMs = 5000;
const schemaRss = yup.string().required().trim().url();

const isValidUrl = (url, rssUrl = []) => {
  try {
    schemaRss.notOneOf(rssUrl).validateSync(url);
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
  if (e.isAxiosError) {
    return 'errors.network';
  }
  if (e.isParsingError) {
    return 'errors.noValidRss';
  }
  return 'errors.default';
}

const getRss = async (url) => {
  const urlWithProxy = addProxy(url);
  return axios.get(urlWithProxy).then((resp) => resp.data.contents);
};

function updateRss(watchedState) {
  const promises = watchedState.feeds.map((feed) => {
    const result = getRss(feed.url)
      .then((resp) => parse(resp))
      .then((data) => {
        const items = data.items.reduce((acc, item) => {
          const id = _.uniqueId();
          if (_.includes(watchedState.posts, item)) {
            return [
              ...acc,
              {
                ...item,
                feedId: feed.id,
                id,
                showed: false,
              },
            ];
          }
          return acc;
        }, []);

        if (_.size(items) > 0) {
          watchedState.posts.unshift(...items);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-param-reassign
        watchedState.error = getErrorType(error);
        // eslint-disable-next-line no-param-reassign
        watchedState.form.status = 'failed';
      });
    return result;
  });

  Promise.all(promises).finally(() => {
    setTimeout(() => {
      updateRss(watchedState);
    }, timeRepeatUpdateMs);
  });
}

function submitHandler(state, form) {
  const watchedState = state;
  const formData = new FormData(form);
  const url = formData.get('url');
  const rssUrlList = watchedState.feeds.reduce((acc, feed) => [...acc, feed.url], []);
  const error = isValidUrl(url, rssUrlList);
  if (error) {
    const errorMessage = `form.errors.${error.type}`;
    watchedState.form.fields.url = {
      valid: false,
      error: errorMessage,
    };
    return;
  }
  watchedState.form.fields.url = {
    valid: true,
    error: null,
  };
  watchedState.form.status = 'getting';

  getRss(url)
    .then((resp) => parse(resp))
    .then((resp) => {
      const id = _.uniqueId();
      const feed = {
        title: resp.title,
        description: resp.description,
        link: resp.link,
        url,
        id,
      };
      const items = resp.items.map((item) => ({
        ...item,
        feedId: id,
        id: _.uniqueId(),
      }));
      watchedState.rssUrl.push(url);
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...items);
      watchedState.form.status = 'success';
      watchedState.form.status = 'filling';
    })
    .catch((e) => {
      watchedState.error = getErrorType(e);
      watchedState.form.status = 'failed';
    });
}

async function app() {
  const i18next = i18n.createInstance();
  await i18next.init({
    lng: 'ru',
    resources: {
      ru,
    },
    debug: true,
  });

  const elements = {
    form: document.querySelector('.rss-form'),
    submit: document.querySelector('#submit'),
    url: document.querySelector('#form-url'),
    feeds: document.querySelector('[data-feeds-wrap]'),
    posts: document.querySelector('[data-posts-wrap]'),
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
      show: false,
      post: null,
    },
    rssUrl: [],
    feeds: [],
    posts: [],
    viewedPostsId: [],
    feedback: null,
    error: null,
    ui: {
      lastShowingPost: null,
    },
  };

  const watchedState = initView(state, elements, i18next);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitHandler(watchedState, event.currentTarget);
  });

  elements.posts.addEventListener('click', (event) => {
    if (!_.has(event.target.dataset, 'postId')) {
      return;
    }
    const { postId } = event.target.dataset;
    if (watchedState.viewedPostsId.includes(postId) || postId === undefined) {
      return;
    }

    const post = _.find(watchedState.posts, { id: postId });
    watchedState.ui.lastShowingPost = event.target.previousElementSibling;
    post.showed = true;
    watchedState.modal = {
      post,
    };
  });

  setTimeout(() => {
    updateRss(watchedState);
  }, timeRepeatUpdateMs);
  return true;
}

export default app;
