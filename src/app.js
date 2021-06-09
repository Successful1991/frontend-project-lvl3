import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';

import i18n from 'i18next';
import ru from './language/ru';
import initView from './view';
import parse from './parser';

const timeRepeatUpdateMs = 5000;
const schemaRss = yup.string().required().trim().url();

const validateUrl = (url, rssUrlColl = []) => {
  try {
    schemaRss.notOneOf(rssUrlColl).validateSync(url);
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
      .then((resp) => {
        const data = parse(resp);
        const items = data.items.map((item) => {
          const id = _.uniqueId();
          return {
            ...item,
            feedId: feed.id,
            id,
            showed: false,
          };
        }, []);
        const oldItems = watchedState.posts.filter((post) => post.feedId === feed.id);
        const y = _.differenceWith(oldItems, items, (a, b) => _.isMatchWith(a, b, (a1, b1) => a1 === b1));
        console.log(y);
        // const items = data.items.reduce((acc, item) => {
        //   const id = _.uniqueId();
        //   if (_.includes(watchedState.posts, item)) {
        //     return [
        //       ...acc,
        //       {
        //         ...item,
        //         feedId: feed.id,
        //         id,
        //         showed: false,
        //       },
        //     ];
        //   }
        //   return acc;
        // }, []);

        if (_.size(items) > 0) {
          watchedState.posts.unshift(...items);
        }
      })
      .catch((error) => {
        console.error = error;
      });
    return result;
  });

  Promise.all(promises).finally(() => {
    setTimeout(() => {
      updateRss(watchedState);
    }, timeRepeatUpdateMs);
  });
}

function submitHandler(watchedState, form) {
  const formData = new FormData(form);
  const url = formData.get('url');
  const rssUrlList = watchedState.feeds.map((feed) => feed.url);
  const error = validateUrl(url, rssUrlList);
  if (error) {
    const errorMessage = `form.errors.${error.type}`;
    // eslint-disable-next-line no-param-reassign
    watchedState.form.fields.url = {
      valid: false,
      error: errorMessage,
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
      const id = _.uniqueId();
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
        id: _.uniqueId(),
      }));
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...items);
      // eslint-disable-next-line no-param-reassign
      watchedState.form.status = 'success';
      // eslint-disable-next-line no-param-reassign
      watchedState.form.status = 'filling';
    })
    .catch((e) => {
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
      resources: {
        ru,
      },
      debug: true,
    })
    .then(() => {
      const elements = {
        form: document.querySelector('.rss-form'),
        submit: document.querySelector('#submit'),
        url: document.querySelector('#form-url'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
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
        feeds: [],
        posts: [],
        viewedPostsId: [],
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
    });
}

export default app;
