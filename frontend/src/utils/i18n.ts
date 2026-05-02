import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translations from '../locales/translations.json';

const resources = {
  en: {
    translation: translations.en
  },
  el: {
    translation: translations.el
  }
};

i18n
  .use(initReactI18next).init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;