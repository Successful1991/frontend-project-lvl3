import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import render from './view';
import parse from './parser';
import init from './init';

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', true);
  return urlWithProxy.toString();
};

const getRss = async (url) => {
  const urlWithProxy = addProxy(url);
  return axios.get(urlWithProxy)
    .then((resp) => parse(resp.data.contents))
    .catch((error) => { throw error; });
};

function updateRss(feed, watchedState) {
  const state = watchedState;
  getRss(feed.url)
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
      setTimeout(() => {
        updateRss(feed, watchedState);
      }, 5000);
    })
    .catch((error) => {
      state.feedback = error;
      throw new Error(error);
    });
}

function app() {
  init();
  const elements = {
    form: document.querySelector('form'),
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
  const watchedState = render(state, elements);
  const schemaRss = yup.string().required().trim().url();

  const isValidUrl = (url) => {
    try {
      schemaRss.notOneOf(watchedState.rssUrl).validateSync(url);
      return null;
    } catch (e) {
      return e;
    }
  };

  function submitHandler(form) {
    const formData = new FormData(form);
    const url = formData.get('url');
    const error = isValidUrl(url);

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
        updateRss(feed, watchedState);
      })
      .catch(() => {
        watchedState.error = i18next.t('errors.network');
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

  return true;
}

export { app, getRss };
