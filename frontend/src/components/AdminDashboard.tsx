import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, updateUserRole, updateUserEnabled, deleteUser, createUser } from '../services/api';
import { User, UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);
  const [addingUser, setAddingUser] = useState(false);
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
      const response = await createUser(newUsername, newPassword, newEmail, newRole);
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setNewUsername('');
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
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
      
      <div className="user-list">
        <table>
          <thead>
            <tr>
              <th>{t('id')}</th>
              <th>{t('username')}</th>
              <th>{t('email')}</th>
              <th>{t('role')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.enabled ? 'disabled-row' : ''}>
                <td>{user.id}</td>
                <td>
                  {user.username}
                  {currentUser && user.id === currentUser.id && (
                    <span className="you-badge">{t('you')}</span>
                  )}
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.enabled ? 'enabled' : 'disabled'}`}>
                    {user.enabled ? t('active') : t('disabled')}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {currentUser && user.id !== currentUser.id ? (
                      <>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="role-select"
                        >
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.USER}>User</option>
                          <option value={UserRole.VIEWER}>Viewer</option>
                        </select>
                        <button
                          className={`btn ${user.enabled ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleEnabled(user.id, !user.enabled)}
                        >
                          {user.enabled ? t('disable') : t('enable')}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          {t('delete')}
                        </button>
                      </>
                    ) : (
                      <span className="no-actions">{t('cannotModifySelf')}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
