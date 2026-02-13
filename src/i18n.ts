
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationES from './locales/es.json';
import translationEN from './locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: {
                translation: translationES
            },
            en: {
                translation: translationEN
            }
        },
        lng: "es", // default language
        fallbackLng: "es",

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
