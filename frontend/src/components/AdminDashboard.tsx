import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, updateUserRole, updateUserEnabled, deleteUser, createUser, updateUser, resetPassword } from '../services/api';
import { User, UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);
  const [addingUser, setAddingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const { user: currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      setError(t('failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate, fetchUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAddingUser(true);

    try {
      const response = await createUser(newUsername, newName, newPassword, newEmail, newRole);
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole(UserRole.USER);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToCreateUser'));
      } else {
        setError(t('failedToCreateUser'));
      }
    } finally {
      setAddingUser(false);
    }
  };

  const handleRoleChange = async (userId: number, newRoleValue: UserRole) => {
    if (currentUser && userId === currentUser.id) {
      setError(t('cannotChangeOwnRole'));
      return;
    }

    try {
      setError('');
      await updateUserRole(userId, newRoleValue);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRoleValue } : u
      ));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToUpdateRole'));
      } else {
        setError(t('failedToUpdateRole'));
      }
    }
  };

  const handleToggleEnabled = async (userId: number, enabled: boolean) => {
    if (currentUser && userId === currentUser.id) {
      setError(t('cannotDisableOwnAccount'));
      return;
    }

    try {
      setError('');
      await updateUserEnabled(userId, enabled);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, enabled } : u
      ));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToUpdateStatus'));
      } else {
        setError(t('failedToUpdateStatus'));
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (currentUser && userId === currentUser.id) {
      setError(t('cannotDeleteOwnAccount'));
      return;
    }

    if (!window.confirm(t('deleteUserConfirm'))) {
      return;
    }

    try {
      setError('');
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToDeleteUser'));
      } else {
        setError(t('failedToDeleteUser'));
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditName(user.name);
    setEditEmail(user.email);
    setShowEditModal(true);
    setError('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setUpdatingUser(true);

    try {
      const response = await updateUser(editingUser.id, {
        username: editUsername,
        name: editName,
        email: editEmail
      });
      setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToUpdateUser'));
      } else {
        setError(t('failedToUpdateUser'));
      }
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setResetPasswordValue('');
    setResetPasswordConfirm('');
    setShowResetPasswordModal(true);
    setError('');
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    setError('');

    // Validate passwords
    if (!resetPasswordValue) {
      setError(t('newPasswordRequired'));
      return;
    }

    if (resetPasswordValue.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (resetPasswordValue !== resetPasswordConfirm) {
      setError(t('passwordMismatch'));
      return;
    }

    if (!window.confirm(t('resetPasswordConfirm'))) {
      return;
    }

    setResettingPassword(true);

    try {
      await resetPassword(resetPasswordUser.id, resetPasswordValue);
      setShowResetPasswordModal(false);
      setResetPasswordUser(null);
      setResetPasswordValue('');
      setResetPasswordConfirm('');
      alert(t('passwordResetSuccess'));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || t('failedToResetPassword'));
      } else {
        setError(t('failedToResetPassword'));
      }
    } finally {
      setResettingPassword(false);
    }
  };

  const getRoleBadgeClass = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'admin';
      case UserRole.USER:
        return 'user';
      case UserRole.VIEWER:
        return 'viewer';
      default:
        return '';
    }
  };

  const openAddModal = () => {
    setError('');
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole(UserRole.USER);
    setShowAddModal(true);
  };

  const toggleUser = (id: number) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return <div className="loading">{t('loadingUsers')}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="section-header">
        <h2>{t('adminDashboard')}</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          {t('addUser')}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('addNewUser')}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label htmlFor="new-username">{t('username')}</label>
                <input
                  type="text"
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder={t('enterUsername')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-name">{t('name')}</label>
                <input
                  type="text"
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder={t('enterName')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-email">{t('email')}</label>
                <input
                  type="email"
                  id="new-email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder={t('email')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">{t('password')}</label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder={t('enterPassword')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-role">{t('role')}</label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.VIEWER}>Viewer</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingUser}>
                  {addingUser ? t('adding') : t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('editUser')}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label htmlFor="edit-username">{t('username')}</label>
                <input
                  type="text"
                  id="edit-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-name">{t('name')}</label>
                <input
                  type="text"
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-email">{t('email')}</label>
                <input
                  type="email"
                  id="edit-email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingUser}>
                  {updatingUser ? t('updating') : t('update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('resetPassword')} - {resetPasswordUser.username}</h3>
              <button className="modal-close" onClick={() => setShowResetPasswordModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label htmlFor="reset-password">{t('newPassword')}</label>
                <input
                  type="password"
                  id="reset-password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  required
                  placeholder={t('enterNewPassword')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reset-password-confirm">{t('confirmPassword')}</label>
                <input
                  type="password"
                  id="reset-password-confirm"
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  required
                  placeholder={t('confirmNewPassword')}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetPasswordModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={resettingPassword}>
                  {resettingPassword ? t('updating') : t('resetPassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="user-list-modern">
        {users.map((user) => {
          const isExpanded = expandedUserId === user.id;
          const isSelf = currentUser && user.id === currentUser.id;
          return (
            <div key={user.id} className={`user-card-modern ${!user.enabled ? 'disabled-card' : ''}`}>
              <div className="user-header-modern" onClick={() => toggleUser(user.id)}>
                <div className="user-title-section">
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <div>
                    <h3 className="user-title">
                      {user.username}
                      {isSelf && <span className="you-badge-modern">{t('you')}</span>}
                    </h3>
                    <p className="user-subtitle">{user.name}</p>
                  </div>
                </div>
                <div className="user-meta">
                  <span className={`role-badge-modern ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`status-badge-modern ${user.enabled ? 'enabled' : 'disabled'}`}>
                    {user.enabled ? t('active') : t('disabled')}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="user-body-modern">
                  <div className="user-details">
                    <div className="detail-item">
                      <span className="detail-label">{t('name')}:</span>
                      <span className="detail-value">{user.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('email')}:</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('role')}:</span>
                      <span className="detail-value">
                        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('status')}:</span>
                      <span className="detail-value">
                        <span className={`status-badge ${user.enabled ? 'enabled' : 'disabled'}`}>
                          {user.enabled ? t('active') : t('disabled')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {!isSelf ? (
                    <div className="user-actions">
                      <div className="role-change-section">
                        <label htmlFor={`role-${user.id}`}>{t('changeRole')}:</label>
                        <select
                          id={`role-${user.id}`}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="role-select-modern"
                        >
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.USER}>User</option>
                          <option value={UserRole.VIEWER}>Viewer</option>
                        </select>
                      </div>
                      <div className="action-buttons-section">
                        <button
                          className="btn-action btn-secondary"
                          onClick={() => handleEditUser(user)}
                        >
                          ✎ {t('edit')}
                        </button>
                        <button
                          className="btn-action btn-primary"
                          onClick={() => handleResetPassword(user)}
                        >
                          🔑 {t('resetPassword')}
                        </button>
                        <button
                          className={`btn-action ${user.enabled ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleEnabled(user.id, !user.enabled)}
                        >
                          {user.enabled ? '⏸ ' + t('disable') : '▸ ' + t('enable')}
                        </button>
                        <button
                          className="btn-action btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          × {t('delete')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="no-actions-message">
                      {t('cannotModifySelf')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
