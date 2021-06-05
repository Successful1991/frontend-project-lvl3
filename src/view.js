import onChange from 'on-change';

const renderError = (elements, message, i18next) => {
  const feedbackEl = elements.feedback;
  feedbackEl.classList.remove('text-success');
  feedbackEl.classList.add('text-danger');
  feedbackEl.innerHTML = i18next.t(message);
};

const renderSuccess = (elements, message, i18next) => {
  const feedbackEl = elements.feedback;
  feedbackEl.classList.remove('text-danger');
  feedbackEl.classList.add('text-success');
  feedbackEl.innerHTML = i18next.t(message);
};

const renderFeeds = (data, elements) => {
  const feedsEl = elements.feeds;
  feedsEl.innerHTML = '';

  data.forEach((feed) => {
    const feedHtml = `<li class="list-group-item "><h3>${feed.title}</h3><p>${feed.description}</p></li>`;
    feedsEl.innerHTML = feedHtml;
  });
};

const renderPosts = (feeds, elements, i18next) => {
  const postsEl = elements.posts;
  postsEl.innerHTML = '';
  const posts = feeds.map((item) => {
    const result = `<li class="list-group-item d-flex justify-content-between align-items-start" data-post-element>
    <a href="${item.link}" class="${item.showed ? 'fw-normal' : 'fw-bold'}">${item.title}</a>
    <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modal" data-post-id="${item.id}">
      ${i18next.t('form.button')}
    </button></li>`;
    return result;
  });
  const postsHtml = posts.join('');
  postsEl.innerHTML = postsHtml;
};

const renderForm = (status, elements, i18next) => {
  switch (status) {
    case 'filling':
      elements.form.reset();
      elements.url.removeAttribute('disabled');
      elements.url.removeAttribute('readonly');
      elements.submit.removeAttribute('disabled');
      renderSuccess(elements, 'messages.success', i18next);
      break;
    case 'getting':
      elements.url.setAttribute('disabled', 'disabled');
      elements.url.setAttribute('readonly', true);
      elements.submit.setAttribute('disabled', 'disabled');
      break;
    case 'failed':
      elements.url.removeAttribute('disabled');
      elements.submit.removeAttribute('disabled');
      elements.url.removeAttribute('readonly');
      break;
    default:
      throw new Error(`Unknown form status: ${status}`);
  }
};

const changeFontWidth = (element) => {
  element.classList.remove('fw-bold');
  element.classList.add('fw-normal');
};

const renderModal = (modal, elements) => {
  const { title, description, link } = modal.post;
  const modalEl = elements.modal;
  modalEl.title.textContent = title;
  modalEl.content.textContent = description;
  modalEl.link.setAttribute('href', link);
};

const clearInput = (field) => {
  const urlEl = field;
  urlEl.classList.remove('is-valid');
  urlEl.classList.remove('is-invalid');
};

const setValidInput = (element) => {
  element.classList.add('is-valid');
};

const setInvalidInput = (element) => {
  element.classList.add('is-invalid');
};

const renderFormError = (field, elements) => {
  clearInput(elements.url);
  if (field.valid) {
    setValidInput(elements.url);
  } else {
    setInvalidInput(elements.url);
  }
};

function initView(state, elements, i18next) {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.fields.url':
        renderFormError(value, elements);
        renderError(elements, value.error, i18next);
        break;
      case 'form.status':
        renderForm(value, elements, i18next);
        break;
      case 'error':
        renderError(elements, value, i18next);
        break;
      case 'feedback':
        renderSuccess(elements, value, i18next);
        break;
      case 'feeds':
        renderFeeds(value, elements);
        break;
      case 'posts':
        renderPosts(value, elements, i18next);
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
export default initView;
