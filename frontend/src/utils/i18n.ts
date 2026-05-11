import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translations from '../locales/translations.json';
import kernighanlinTranslations from '../locales/kernighan-lin.json';
import fiducciamattheysesTranslations from '../locales/fiduccia-mattheyses.json';
import metisTranslations from '../locales/METIS.json';

const resources = {
  en: {
    translation: {
      ...translations.en,
      ...kernighanlinTranslations.en,
      ...fiducciamattheysesTranslations.en,
      ...metisTranslations.en
    }
  },
  el: {
    translation: {
      ...translations.el,
      ...kernighanlinTranslations.el,
      ...fiducciamattheysesTranslations.el,
      ...metisTranslations.el
    }
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