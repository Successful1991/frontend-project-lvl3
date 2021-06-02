import onChange from 'on-change';
import i18next from 'i18next';

function renderError(elements, message) {
  const feedbackEl = elements.feedback;
  feedbackEl.classList.remove('text-success');
  feedbackEl.classList.add('text-danger');
  feedbackEl.innerHTML = message;
}

function renderSuccess(elements, message) {
  const feedbackEl = elements.feedback;
  feedbackEl.classList.remove('text-danger');
  feedbackEl.classList.add('text-success');
  feedbackEl.innerHTML = message;
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
  const posts = feeds.map((item) => `<li class="list-group-item d-flex justify-content-between align-items-start" data-post-element>
      <a href="${item.link}" class="${(item.showed ? 'font-weight-normal fw-normal' : 'font-weight-bold fw-bold')}">${item.title}</a>
      <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modal" data-post-id="${item.id}">${i18next.t('form.button')}</button></li>`);
  const postsHtml = posts.join('');
  postsEl.innerHTML = postsHtml;
}

function renderForm(status, elements, watchedState) {
  switch (status) {
    case 'filling':
      elements.form.reset();
      elements.url.removeAttribute('disable');
      elements.submit.removeAttribute('disable');
      renderSuccess(elements, i18next.t('messages.success'));
      break;
    case 'getting':
      elements.url.setAttribute('disable', true);
      elements.submit.setAttribute('disable', true);
      break;
    case 'failed':
      elements.url.removeAttribute('disable');
      elements.submit.removeAttribute('disable');
      renderError(elements, watchedState.error);
      break;
    default:
      throw new Error(`Unknown form status: ${status}`);
  }
}

function changeFontWidth(element) {
  element.classList.remove('font-weight-bold', 'fw-bold');
  element.classList.add('font-weight-normal', 'fw-normal');
}

function renderModal(modal, elements) {
  const { title, description, link } = modal.post;
  const modalEl = elements.modal;
  modalEl.title.textContent = title;
  modalEl.content.textContent = description;
  modalEl.link.setAttribute('href', link);
}

function render(state, elements) {
  const clearInput = () => {
    const urlEl = elements.url;
    urlEl.classList.remove('is-valid');
    urlEl.classList.remove('is-invalid');
  };
  const setValidInput = () => {
    elements.url.classList.add('is-valid');
  };
  const setInvalidInput = () => {
    elements.url.classList.add('is-invalid');
  };

  function renderFormError(field) {
    clearInput();
    if (field.valid) {
      setValidInput();
    } else {
      setInvalidInput();
    }
    renderError(elements, field.error);
  }

  const watchedState = onChange(state, function watchedState(path, value) {
    switch (path) {
      case 'form.fields.url':
        renderFormError(value);
        break;
      case 'form.status':
        renderForm(value, elements, this);
        break;
      case 'feedback':
        renderSuccess(elements, value);
        break;
      case 'data.feeds':
        renderFeeds(value, elements);
        break;
      case 'data.posts':
        renderPosts(value, elements);
        break;
      case 'modal':
        renderModal(value, elements);
        break;
      case 'ui.lastShowingPost':
        changeFontWidth(value);
        break;
      default:
        break;
    }
  });

  return watchedState;
}
export default render;
