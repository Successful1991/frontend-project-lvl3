import i18next from 'i18next';
import ru from './language/ru.json';

function init() {
  i18next.init({
    lng: 'ru',
    resources: {
      ru,
    },
    debug: true,
  });
}

export default init;
