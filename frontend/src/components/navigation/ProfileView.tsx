'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Globe, CreditCard, Bell, ChevronRight, Utensils, Shield, Info } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'am', label: 'Amharic', flag: '🇪🇹' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
];

const CURRENCIES = [
  { code: 'ETB', label: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'SAR', label: 'Saudi Riyal', symbol: '﷼' },
];

type ExpandedSection = 'none' | 'language' | 'currency';

export function ProfileView() {
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('ETB');
  const [expanded, setExpanded] = useState<ExpandedSection>('none');
  const [waiterCalled, setWaiterCalled] = useState(false);

  const selectedLang = LANGUAGES.find((l) => l.code === language)!;
  const selectedCurr = CURRENCIES.find((c) => c.code === currency)!;

  const toggleSection = (section: ExpandedSection) => {
    setExpanded((prev) => (prev === section ? 'none' : section));
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  return (
    <div className="profile-view">
      {/* Profile Header */}
      <div className="profile-view__header">
        <div className="profile-view__avatar">
          <User size={32} />
        </div>
        <h3 className="profile-view__name">Guest User</h3>
        <p className="profile-view__desc">Customize your experience</p>
      </div>

      {/* Settings Cards */}
      <div className="profile-view__settings">

        {/* Language */}
        <div className="profile-view__card">
          <button
            className="profile-view__card-header"
            onClick={() => toggleSection('language')}
            id="profile-language-toggle"
          >
            <div className="profile-view__card-left">
              <div className="profile-view__card-icon profile-view__card-icon--blue">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="profile-view__card-title">Language</h4>
                <p className="profile-view__card-value">{selectedLang.flag} {selectedLang.label}</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`profile-view__chevron ${expanded === 'language' ? 'profile-view__chevron--open' : ''}`}
            />
          </button>
          {expanded === 'language' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="profile-view__card-body"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`profile-view__option ${language === lang.code ? 'profile-view__option--active' : ''}`}
                  onClick={() => { setLanguage(lang.code); setExpanded('none'); }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <span className="profile-view__check">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Currency */}
        <div className="profile-view__card">
          <button
            className="profile-view__card-header"
            onClick={() => toggleSection('currency')}
            id="profile-currency-toggle"
          >
            <div className="profile-view__card-left">
              <div className="profile-view__card-icon profile-view__card-icon--green">
                <CreditCard size={18} />
              </div>
              <div>
                <h4 className="profile-view__card-title">Currency</h4>
                <p className="profile-view__card-value">{selectedCurr.symbol} {selectedCurr.label}</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`profile-view__chevron ${expanded === 'currency' ? 'profile-view__chevron--open' : ''}`}
            />
          </button>
          {expanded === 'currency' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="profile-view__card-body"
            >
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  className={`profile-view__option ${currency === curr.code ? 'profile-view__option--active' : ''}`}
                  onClick={() => { setCurrency(curr.code); setExpanded('none'); }}
                >
                  <span className="profile-view__option-symbol">{curr.symbol}</span>
                  <span>{curr.label}</span>
                  {currency === curr.code && (
                    <span className="profile-view__check">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Dietary Preferences */}
        <div className="profile-view__card">
          <button className="profile-view__card-header" id="profile-dietary">
            <div className="profile-view__card-left">
              <div className="profile-view__card-icon profile-view__card-icon--orange">
                <Utensils size={18} />
              </div>
              <div>
                <h4 className="profile-view__card-title">Dietary Preferences</h4>
                <p className="profile-view__card-value">No restrictions set</p>
              </div>
            </div>
            <ChevronRight size={18} className="profile-view__chevron" />
          </button>
        </div>

        {/* Nutrition Tracker */}
        <div className="profile-view__card">
          <button className="profile-view__card-header" id="profile-nutrition">
            <div className="profile-view__card-left">
              <div className="profile-view__card-icon profile-view__card-icon--purple">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="profile-view__card-title">Nutrition Goals</h4>
                <p className="profile-view__card-value">Track macros & vitamins</p>
              </div>
            </div>
            <ChevronRight size={18} className="profile-view__chevron" />
          </button>
        </div>
      </div>

      {/* Call Waiter */}
      <div className="profile-view__service">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleCallWaiter}
          className={`profile-view__waiter-btn ${waiterCalled ? 'profile-view__waiter-btn--called' : ''}`}
          id="profile-call-waiter"
          disabled={waiterCalled}
        >
          <Bell size={20} className={waiterCalled ? 'animate-pulse' : ''} />
          {waiterCalled ? 'Waiter Notified!' : 'Call Waiter'}
        </motion.button>
      </div>

      {/* Footer */}
      <div className="profile-view__footer">
        <Info size={14} />
        <span>Powered by ArifSmart · v1.0</span>
      </div>
    </div>
  );
}
