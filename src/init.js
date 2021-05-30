import i18next from 'i18next';
import en from './en.json';

function init() {
  i18next.init({
    lng: 'en',
    resources: {
      en,
    },
    debug: true,
  });
}

export default init;
