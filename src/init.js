import i18next from "i18next";
import ru from "./language/ru.json";

function init() {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: "ru",
    resources: {
      ru,
    },
    debug: true,
  });
  return i18nextInstance;
}

export default init;
