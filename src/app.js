import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import render from './view';
import parse from './parser';

function app() {
  const elements = {
    form: document.querySelector('form'),
    submit: document.querySelector('#submit'),
    url: document.querySelector('#form-url'),
    feeds: document.querySelector('[data-feeds-wrap]'),
    posts: document.querySelector('[data-posts-wrap]'),
    feedback: document.querySelector('[data-feedback-message]'),
  };

  const state = {
    form: {
      status: 'filling', // filling, getting, failed
      isValid: true,
    },
    feeds: [],
    posts: [],
    feedback: '',
  };
  const watchedState = render(state, elements);
  const schemaRss = yup.string().required().trim().url();

  const addProxy = (url) => {
    const urlWithProxy = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');
    urlWithProxy.searchParams.set('url', url);
    urlWithProxy.searchParams.set('disableCache', true);
    return urlWithProxy.toString();
  };

  const getRss = (url) => {
    const urlWithProxy = addProxy(url);
    return axios.get(urlWithProxy)
      .then((resp) => parse(resp.data.contents))
      .catch((error) => { throw error; });
  };

  const isValidUrl = (url) => {
    const isValid = schemaRss.isValidSync(url);
    return (isValid && !_.includes(watchedState.feeds, url));
  };

  function createRss(url) {
    const promise = new Promise((resolve, reject) => {
      getRss(url).then(resolve).catch(reject);
    });
    promise
      .then((data) => {
        const id = _.uniqueId();
        const feed = {
          title: data.title,
          description: data.description,
          link: data.link,
          id,
        };
        const items = data.items.map((item) => ({ ...item, feedId: id, id: _.uniqueId() }));
        watchedState.feeds.unshift(feed);
        watchedState.feedback = 'RSS успешно добавлен';
        watchedState.posts.unshift(...items);
      })
      .catch((error) => {
        watchedState.feedback = error;
        watchedState.status = 'failed';
        throw new Error(error);
      });
  }

  function submitHandler(form) {
    const formData = new FormData(form);
    const url = formData.get('url');
    if (isValidUrl(url)) {
      createRss(url);
      watchedState.form.isValid = true;
      watchedState.form.status = 'filling';
    } else {
      watchedState.feedback = 'Url is not valid';
      watchedState.form.isValid = false;
      watchedState.form.status = 'failed';
    }
  }

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitHandler(event.currentTarget);
  });
}

export default app;
