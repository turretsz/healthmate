// src/components/Profile.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './styles/Profile.css';

const isWeakPassword = (value) => {
  if (!value) return true;
  const hasMinLength = value.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const banned = ['123456', 'password', 'qwerty', '111111', '12345678', '123456789'];
  const containsBanned = banned.some((p) => value.toLowerCase().includes(p));
  return !(hasMinLength && hasLetter && hasNumber) || containsBanned;
};

const Profile = ({ featureFlags = {}, onToggleFeature }) => {
  const navigate = useNavigate();
  const {
    user,
    users,
    updateProfile,
    changePassword,
    setUserPlan,
    deleteUser,
    updateUserAdmin,
    refreshUsersFromServer,
  } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || 'other',
    birthDate: user?.birthDate || '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', plan: 'Free', role: 'user' });
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Tên không được để trống.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email không được để trống.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({
        name: form.name.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        email: form.email,
      });
      setMessage('Đã lưu thông tin cá nhân.');
      setEditing(false);
    } catch (e) {
      setError(e.message || 'Không thể lưu thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword) {
      setError('Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (isWeakPassword(security.newPassword)) {
      setError('Mật khẩu mới quá yếu. Hãy dùng tối thiểu 8 ký tự, gồm cả chữ và số và tránh chuỗi dễ đoán.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await changePassword(security);
      setMessage('Đã đổi mật khẩu.');
      setSecurity({ currentPassword: '', newPassword: '' });
    } catch (e) {
      setError(e.message || 'Không thể đổi mật khẩu.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && refreshUsersFromServer) {
      refreshUsersFromServer();
    }
  }, [user?.role, refreshUsersFromServer]);

  const sortedUsers = () => {
    if (!Array.isArray(users) || !users.length) return [];
    const term = searchTerm.trim().toLowerCase();
    return [...users]
      .map((u) => {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        let score = 0;
        if (term) {
          const combined = `${name} ${email}`;
          if (combined.includes(term)) score += 1;
          if (name.startsWith(term) || email.startsWith(term)) score += 2;
          if (name === term || email === term) score += 4;
        }
        return { ...u, _score: score };
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        return (a.name || '').localeCompare(b.name || '');
      });
  };

  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      plan: u.plan || 'Free',
      role: u.role || 'user',
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditForm({ name: '', email: '', plan: 'Free', role: 'user' });
  };

  const saveEditUser = async () => {
    if (!editingUserId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateUserAdmin(editingUserId, editForm);
      setMessage('Đã cập nhật tài khoản.');
      setEditingUserId(null);
      if (refreshUsersFromServer) await refreshUsersFromServer();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật người dùng.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-width profile-page">
      <div className="profile-card">
        <div className="profile-head">
          <div>
            <p className="label">Thông tin cá nhân</p>
            <h1>{user.name}</h1>
            <p className="sub">Email: {user.email}</p>
            <p className="sub">User ID: {user.id}</p>
            <p className="sub">Gói: {user.plan} {user.role === 'admin' ? '• Admin' : ''}</p>
          </div>
          <div className="profile-actions">
            <button className="profile-back" onClick={() => navigate('/')}>← Quay lại</button>
          </div>
        </div>

        <div className="profile-grid">
          <div className="pane">
            <div className="pane-head">
              <p className="label">Hồ sơ</p>
              <button className="profile-edit" onClick={() => setEditing((prev) => !prev)}>
                {editing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>
            {editing ? (
              <>
                <label>
                  Họ và tên
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Tên hiển thị"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                  />
                </label>
                <label>
                  Giới tính
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                    <option value="other">Khác</option>
                  </select>
                </label>
                <label>
                  Ngày sinh
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </label>
                <button onClick={handleSave} disabled={saving}>Lưu thông tin</button>
              </>
            ) : (
              <div className="profile-view">
                <p><strong>Họ và tên:</strong> {form.name}</p>
                <p><strong>Email:</strong> {form.email}</p>
                <p><strong>Giới tính:</strong> {form.gender === 'female' ? 'Nữ' : form.gender === 'male' ? 'Nam' : 'Khác'}</p>
                <p><strong>Ngày sinh:</strong> {form.birthDate || '--'}</p>
              </div>
            )}
          </div>

          <div className="pane">
            <h3>Bảo mật</h3>
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                placeholder="•••••••"
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
              />
            </label>
            <button onClick={handleChangePassword} disabled={saving}>Đổi mật khẩu</button>
          </div>

          {user.role === 'admin' && (
            <div className="pane">
              <h3>Quyền mở khóa tính năng (Admin)</h3>
              <p className="sub">Bật/tắt để cho phép tất cả tài khoản sử dụng.</p>
              {['dashboard', 'bmr', 'heart'].map((key) => (
                <label key={key} className="feature-toggle">
                  <input
                    type="checkbox"
                    checked={!!featureFlags[key]}
                    onChange={(e) => onToggleFeature?.(key, e.target.checked)}
                  />
                  <span>{key === 'dashboard' ? 'Nhật ký / Dashboard' : key === 'bmr' ? 'BMR & TDEE' : 'Nhịp tim'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {user.role === 'admin' && (
          <div className="pane admin-users">
            <div className="pane-head">
              <div>
                <p className="label">Quản lý người dùng</p>
                <h3>{users?.length ? `${users.length} tài khoản` : 'Danh sách tài khoản'}</h3>
              </div>
              <div className="admin-user-actions">
                <input
                  className="admin-user-search"
                  placeholder="Tìm tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="profile-edit" onClick={() => refreshUsersFromServer?.()}>Đồng bộ</button>
              </div>
            </div>
            {!users?.length && <p className="sub">Chưa có dữ liệu tài khoản.</p>}
            <div className="admin-user-list">
              {sortedUsers().map((u) => {
                const isCurrent = user && u.id === user.id;
                const canManage = u.role !== 'admin' || isCurrent;
                return (
                  <div key={u.id} className="admin-user-row">
                    <div>
                      <strong>{u.name}</strong>
                      <p className="sub">Email: {u.email || '---'}</p>
                      <p className="sub">Gói: {u.plan || 'Free'} {u.role === 'admin' ? '• Admin' : ''} {isCurrent ? '• Bạn' : ''}</p>
                    </div>
                    {canManage ? (
                      editingUserId === u.id ? (
                        <div className="admin-user-actions column">
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Tên"
                          />
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Email"
                          />
                          <div className="user-action-row">
                            <select
                              value={editForm.plan}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, plan: e.target.value }))}
                            >
                              <option value="Free">Free</option>
                              <option value="Pro">Pro</option>
                            </select>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div className="user-action-row">
                            <button onClick={saveEditUser} disabled={saving}>Lưu</button>
                            <button className="profile-edit" onClick={cancelEditUser}>Hủy</button>
                          </div>
                        </div>
                      ) : (
                        <div className="admin-user-actions">
                          <button onClick={() => setUserPlan(u.id, u.plan === 'Pro' ? 'Free' : 'Pro')}>
                            {u.plan === 'Pro' ? 'Hạ cấp' : 'Mở khóa'}
                          </button>
                          <button onClick={() => startEditUser(u)}>Sửa</button>
                          {u.role !== 'admin' && (
                            <button
                              className="danger"
                              onClick={() => {
                                if (window.confirm(`Bạn chắc chắn muốn xóa tài khoản ${u.name}?`)) {
                                  deleteUser(u.id);
                                  setMessage('Đã xóa tài khoản.');
                                }
                              }}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="label">Không thể thao tác</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {message && <div className="banner success">{message}</div>}
        {error && <div className="banner error">{error}</div>}
      </div>
    </div>
  );
};

export default Profile;
