import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/api';

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (!oldPassword) {
      setError(t('oldPasswordRequired'));
      return;
    }

    if (!newPassword) {
      setError(t('newPasswordRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await changePassword(user.id, oldPassword, newPassword);
      setSuccess(t('passwordChangeSuccess'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToChangePassword'));
      } else {
        setError(t('failedToChangePassword'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2>{t('changePassword')}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="change-password-form">
        <div className="form-group">
          <label htmlFor="old-password">{t('oldPassword')}</label>
          <input
            type="password"
            id="old-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder={t('enterOldPassword')}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="new-password">{t('newPassword')}</label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('enterNewPassword')}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">{t('confirmPassword')}</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('confirmNewPassword')}
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? t('updating') : t('changePassword')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
