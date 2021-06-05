import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import initView from './view';
import parse from './parser';
import init from './init';

const timeRepeatUpdateMs = 5000;
init();

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', true);
  return urlWithProxy.toString();
};

const getRss = async (url) => {
  const urlWithProxy = addProxy(url);
  return axios.get(urlWithProxy)
    .then((resp) => resp.data.contents);
};

function updateRss(watchedState) {
  const promises = watchedState.data.feeds.map((feed) => (getRss(feed.url)
    .then((resp) => parse(resp))
    .then((data) => {
      const items = data.items.reduce((acc, item) => {
        const id = _.uniqueId();
        if (_.includes(watchedState.posts, item)) {
          return [...acc, {
            ...item, feedId: feed.id, id, showed: false,
          }];
        }
        return acc;
      }, []);

      if (_.size(items) > 0) {
        watchedState.data.posts.unshift(...items);
      }
    })
    .catch((error) => {
      // eslint-disable-next-line no-param-reassign
      watchedState.feedback = i18next.t(error.message);
      throw new Error(error);
    })
  ));

  Promise.all(promises)
    .finally(() => {
      setTimeout(() => {
        updateRss(watchedState);
      }, timeRepeatUpdateMs);
    });
}

function getErrorType(e) {
  if (e.isAxiosError) {
    return i18next.t('errors.network');
  }
  if (e.isParsingError) {
    return i18next.t('errors.noValidRss');
  }
  return i18next.t('errors.default');
}

function app() {
  const elements = {
    form: document.querySelector('.rss-form'),
    submit: document.querySelector('#submit'),
    url: document.querySelector('#form-url'),
    feeds: document.querySelector('[data-feeds-wrap]'),
    posts: document.querySelector('[data-posts-wrap]'),
    feedback: document.querySelector('[data-feedback-message]'),
    modal: {
      container: document.querySelector('[data-modal]'),
      title: document.querySelector('[data-modal-label]'),
      content: document.querySelector('[data-modal-content]'),
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
    data: {
      feeds: [],
      posts: [],
      viewedPostsId: [],
    },
    feedback: null,
    error: null,
    ui: {
      lastShowingPost: null,
    },
  };
  const schemaRss = yup.string().required().trim().url();

  const isValidUrl = (url, rssUrl = []) => {
    try {
      schemaRss.notOneOf(rssUrl).validateSync(url);
      return null;
    } catch (e) {
      return e;
    }
  };

  const watchedState = initView(state, elements);
  function submitHandler(form) {
    const formData = new FormData(form);
    const url = formData.get('url');
    const error = isValidUrl(url, watchedState.rssUrl);
    if (error) {
      const errorMessage = i18next.t([`form.errors.${error.type}`, 'form.errors.default']);
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
      .then((data) => {
        const id = _.uniqueId();
        const feed = {
          title: data.title,
          description: data.description,
          link: data.link,
          url,
          id,
        };
        const items = data.items.map((item) => ({ ...item, feedId: id, id: _.uniqueId() }));
        watchedState.rssUrl.push(url);
        watchedState.data.feeds.unshift(feed);
        watchedState.data.posts.unshift(...items);
        watchedState.feedback = i18next.t('messages.success');
        watchedState.form.status = 'filling';
      })
      .catch((e) => {
        console.log(e);
        watchedState.error = getErrorType(e);
        watchedState.form.status = 'failed';
      });
  }

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitHandler(event.currentTarget);
  });

  elements.modal.container.addEventListener('show.bs.modal', (event) => {
    const { postId } = event.relatedTarget.dataset;
    if (watchedState.data.viewedPostsId.includes(postId) || postId === undefined) return;
    const post = _.find(watchedState.data.posts, { id: postId });
    watchedState.ui.lastShowingPost = event.relatedTarget.previousElementSibling;
    post.showed = true;

    watchedState.modal = {
      post,
    };
  });
  setTimeout(() => {
    updateRss(watchedState);
  }, 5000);
  return true;
}

export default app;
