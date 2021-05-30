import onChange from 'on-change';

function renderFeedback(message, elements) {
  const feedbackEl = elements.feedback;
  feedbackEl.innerHTML = message;
}

function renderError(elements) {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
}

function renderSuccess(elements) {
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
}

function renderFeeds(data, elements) {
  const feedsEl = elements.feeds;
  feedsEl.innerHTML = '';

  data.forEach((feed) => {
    const feedHtml = `<li class="list-group-item "><h3>${feed.title}</h3><p>${feed.description}</p></li>`;
    feedsEl.innerHTML = feedHtml;
  });
}

function renderPosts(feeds, elements) {
  const postsEl = elements.posts;
  postsEl.innerHTML = '';

  const posts = feeds.map((item) => `<li class="list-group-item d-flex justify-content-between align-items-start">
      <a href="${item.link}" class="font-weight-normal">${item.title}</a>
      <button class="btn btn-primary btn-sm" data-toggle="modal" data-target="#modal">Просмотр</button></li>`);
  const postsHtml = posts.join('');
  postsEl.innerHTML = postsHtml;
}

function renderForm(status, elements) {
  switch (status) {
    case 'filling':
      elements.form.reset();
      elements.url.removeAttribute('disable');
      elements.submit.removeAttribute('disable');
      break;
    case 'getting':
      elements.url.setAttribute('disable');
      elements.submit.setAttribute('disable');
      break;
    case 'failed':
      elements.url.removeAttribute('disable');
      elements.submit.removeAttribute('disable');
      renderError(elements);
      break;
    case 'success':
      renderSuccess(elements);
      break;
    default:
      throw new Error(`Unknown form status: ${status}`);
  }
}

function render(state, elements) {
  const setValidInput = () => {
    elements.url.classList.add('is-valid');
    elements.url.classList.remove('is-invalid');
  };
  const setInvalidInput = () => {
    elements.url.classList.add('is-invalid');
    elements.url.classList.remove('is-valid');
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.isValid':
        if (value) {
          setValidInput();
        } else {
          setInvalidInput();
        }
        break;
      case 'form.status':
        renderForm(value, elements);
        break;
      case 'feeds':
        renderFeeds(value, elements);
        break;
      case 'posts':
        renderPosts(value, elements);
        break;
      case 'feedback':
        renderFeedback(value, elements);
        break;
      default:
        break;
    }
  });

  return watchedState;
}
export default render;
