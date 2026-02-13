import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Selector de idioma
 * Permite cambiar entre español e inglés
 */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'es', label: 'Español', flag: '🇨🇱' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    void i18n.changeLanguage(newLang);
  };

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="language-select" className="sr-only">
        {t('a11y.settings')}
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={handleChange}
        className="appearance-none bg-white border border-slate-300 rounded-md px-3 py-1.5 pr-8 text-sm text-slate-700 cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 transition-colors"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>

      {/* Icono de dropdown */}
      <svg
        className="absolute right-2 w-4 h-4 text-slate-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

export default LanguageSwitcher;
