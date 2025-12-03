import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, updateUserRole, updateUserEnabled, deleteUser } from '../services/api';
import { User, UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    if (currentUser && userId === currentUser.id) {
      setError("You cannot change your own role");
      return;
    }

    try {
      setError('');
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Failed to update role');
      } else {
        setError('Failed to update role');
      }
    }
  };

  const handleToggleEnabled = async (userId: number, enabled: boolean) => {
    if (currentUser && userId === currentUser.id) {
      setError("You cannot disable your own account");
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
        setError(axiosError.response?.data?.error || 'Failed to update status');
      } else {
        setError('Failed to update status');
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (currentUser && userId === currentUser.id) {
      setError("You cannot delete your own account");
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError('');
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Failed to delete user');
      } else {
        setError('Failed to delete user');
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
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard - User Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="user-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.enabled ? 'disabled-row' : ''}>
                <td>{user.id}</td>
                <td>
                  {user.username}
                  {currentUser && user.id === currentUser.id && (
                    <span className="you-badge">(You)</span>
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
                    {user.enabled ? 'Active' : 'Disabled'}
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
                          {user.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="no-actions">Cannot modify self</span>
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
