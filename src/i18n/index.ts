import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useSession } from '@/app/session'
import en from './en.json'
import hi from './hi.json'

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: useSession.getState().language,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

useSession.subscribe((s, prev) => {
  if (s.language !== prev.language) {
    void i18n.changeLanguage(s.language)
    document.documentElement.lang = s.language
  }
})

export default i18n
