import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>{t('footerTitle')}</h4>
          <p>{t('footerDescription')}</p>
        </div>
        
        <div className="footer-section">
          <h4>{t('quickLinks')}</h4>
          <ul>
            <li><Link to="/">{t('dashboard')}</Link></li>
            <li><Link to="/inspections">{t('inspections')}</Link></li>
            <li><Link to="/checklists">{t('checklists')}</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>{t('documents')}</h4>
          <ul>
            <li>
              <a 
                href="/projektbeschreibung.html" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {t('projectDocumentation')}
              </a>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>{t('contact')}</h4>
          <p>{t('supportEmail')}</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} {t('footerTitle')}. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
};

export default Footer;
