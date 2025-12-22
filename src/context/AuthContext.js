// Lightweight auth context with HTTP API + local fallback.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, setApiToken, TOKEN_KEY } from '../services/apiClient';

const deriveAge = (value) => {
  if (value === undefined || value === null) return null;
  const parsedNumber = parseInt(value, 10);
  if (!Number.isNaN(parsedNumber) && parsedNumber > 0 && parsedNumber < 130) {
    return parsedNumber;
  }
  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    const today = new Date();
    let age = today.getFullYear() - parsedDate.getFullYear();
    const monthDiff = today.getMonth() - parsedDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate())) age--;
    return age;
  }
  return null;
};

const normalizeUser = (user) => {
  if (!user) return user;
  const age = deriveAge(user.age ?? user.birthDate);
  return { ...user, age };
};

const isWeakPassword = (value) => {
  if (!value) return true;
  const hasMinLength = value.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const banned = ['123456', 'password', 'qwerty', '111111', '12345678', '123456789'];
  const containsBanned = banned.some((p) => value.toLowerCase().includes(p));
  return !(hasMinLength && hasLetter && hasNumber) || containsBanned;
};

const SESSION_KEY = 'hm_session';
const USERS_KEY = 'hm_users';
const DATA_KEYS = [
  'hm_water_logs',
  'hm_sleep_logs',
  'hm_activity_logs',
  'hm_bmi_logs',
  'hm_bmr_logs',
  'hm_hr_logs',
  'hm_action_logs',
  'hm_status_snapshot',
];
const seedUsers = [
  { id: 1, name: 'Lan', email: 'lan@example.com', password: 'Health@123', gender: 'female', birthDate: '1995-01-01', age: deriveAge('1995-01-01'), plan: 'Free' },
  { id: 2, name: 'Minh', email: 'minh@example.com', password: 'Health@123', gender: 'male', birthDate: '1992-02-02', age: deriveAge('1992-02-02'), plan: 'Pro' },
  { id: 3, name: 'An', email: 'an@example.com', password: 'Health@123', gender: 'female', birthDate: '1998-03-03', age: deriveAge('1998-03-03'), plan: 'Free' },
  { id: 4, name: 'Admin', email: 'admin@healthmate.dev', password: 'Admin@123', gender: 'male', birthDate: '1990-01-01', age: deriveAge('1990-01-01'), plan: 'Pro', role: 'admin' },
];

const AuthContext = createContext(null);

// Mock persistence in localStorage to allow using auth without a backend.
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const ensureSeeded = (list) => {
  const merged = [...list];
  seedUsers.forEach((seed) => {
    if (!merged.find((u) => u.email === seed.email)) merged.push(seed);
  });
  return merged;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) setApiToken(token);
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(normalizeUser(parsed));
      } catch (e) {
        setUser(null);
      }
    }
    try {
      const saved = JSON.parse(localStorage.getItem(USERS_KEY) || '[]').map(normalizeUser);
      if (Array.isArray(saved) && saved.length) {
        setUsers(saved);
      } else {
        const normalizedSeeds = seedUsers.map(normalizeUser);
        setUsers(normalizedSeeds);
        localStorage.setItem(USERS_KEY, JSON.stringify(normalizedSeeds));
      }
    } catch (e) {
      const normalizedSeeds = seedUsers.map(normalizeUser);
      setUsers(normalizedSeeds);
      localStorage.setItem(USERS_KEY, JSON.stringify(normalizedSeeds));
    }
    const hydrateFromServer = async () => {
      if (!token) return;
      const res = await apiRequest('get', '/api/auth/me');
      if (res.ok && res.data?.user) {
        persistSession(res.data.user, token);
        if (Array.isArray(res.data?.users)) {
          const normalized = res.data.users.map(normalizeUser);
          setUsers(normalized);
          localStorage.setItem(USERS_KEY, JSON.stringify(normalized));
        }
      }
    };
    hydrateFromServer();
  }, []);

  const persistSession = (sessionUser, token) => {
    const normalized = normalizeUser(sessionUser);
    setUser(normalized);
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
    if (token) {
      setApiToken(token);
    }
  };

  const persistUsers = (list) => {
    const normalized = list.map(normalizeUser);
    setUsers(normalized);
    localStorage.setItem(USERS_KEY, JSON.stringify(normalized));
  };

  const openAuth = (nextMode = 'login') => {
    setMode(nextMode);
    setIsOpen(true);
  };

  const closeAuth = () => setIsOpen(false);

  const register = async ({ name, gender, birthDate, email, password }) => {
    if (!name?.trim()) throw new Error('Tên không được để trống.');
    if (!email?.trim()) throw new Error('Email không được để trống.');
    if (!birthDate) throw new Error('Ngày sinh không được để trống.');
    if (isWeakPassword(password)) throw new Error('Mật khẩu quá yếu.');

    const payload = { name: name.trim(), gender, birthDate, email: email.trim(), password };
    const apiRes = await apiRequest('post', '/api/auth/register', payload);
    if (apiRes.ok && apiRes.data?.user) {
      persistSession(apiRes.data.user, apiRes.data.token);
      if (apiRes.data.user) {
        persistUsers([...users, { ...apiRes.data.user, password }]);
      }
      return;
    }

    await delay();
    const normalizedEmail = email.trim().toLowerCase();
    const exists = users.find((u) => u.email === normalizedEmail);
    if (exists) throw new Error(apiRes.error || 'Email đã tồn tại.');
    const computedAge = deriveAge(birthDate);
    const newUser = {
      id: Date.now(),
      name: name.trim(),
      gender,
      birthDate,
      age: computedAge,
      email: normalizedEmail,
      password,
      plan: 'Free',
      role: 'user',
    };
    const nextUsers = [...users, newUser];
    persistUsers(nextUsers);
    persistSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      plan: newUser.plan,
      role: newUser.role,
      gender: newUser.gender,
      birthDate: newUser.birthDate,
      age: newUser.age,
    });
  };

  const login = async ({ email, password }) => {
    const payload = { email: email.trim(), password };
    const apiRes = await apiRequest('post', '/api/auth/login', payload);
    if (apiRes.ok && apiRes.data?.user) {
      persistSession(apiRes.data.user, apiRes.data.token);
      const mergedUser = { ...apiRes.data.user, password };
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === mergedUser.id || u.email === mergedUser.email);
        const next = exists ? prev.map((u) => (u.id === mergedUser.id ? mergedUser : u)) : [...prev, mergedUser];
        persistUsers(next);
        return next;
      });
      return;
    }

    await delay();
    const normalizedEmail = email.trim().toLowerCase();
    const match = users.find((u) => u.email === normalizedEmail && u.password === password);
    if (!match) throw new Error(apiRes.error || 'Sai email hoặc mật khẩu.');
    persistSession({
      id: match.id,
      name: match.name,
      email: match.email,
      plan: match.plan,
      role: match.role,
      gender: match.gender,
      birthDate: match.birthDate,
      age: match.age,
    });
  };

  const socialLogin = async (provider) => {
    await delay();
    if (!['google', 'facebook'].includes(provider)) {
      throw new Error('Nhà cung cấp không được hỗ trợ.');
    }
    const pseudo = {
      id: Date.now(),
      name: `${provider}-user`,
      email: `${provider}-${Date.now()}@example.com`,
      plan: 'Free',
      role: 'user',
      birthDate: null,
      age: null,
    };
    const nextUsers = [...users, pseudo];
    persistUsers(nextUsers);
    persistSession(pseudo);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setApiToken(null);
    setUser(null);
    // Reset app state on logout. Use PUBLIC_URL so GH Pages không bị 404.
    const base = process.env.PUBLIC_URL || '';
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    window.location.href = `${normalizedBase}/`;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Chưa đăng nhập');
    const apiRes = await apiRequest('put', '/api/profile', updates);
    if (apiRes.ok && apiRes.data?.user) {
      const updated = normalizeUser(apiRes.data.user);
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
        persistUsers(next);
        persistSession(updated);
        return next;
      });
      return;
    }

    await delay();
    if (updates.email) {
      const normalizedEmail = updates.email.trim().toLowerCase();
      const exists = users.find((u) => u.email === normalizedEmail && u.id !== user.id);
      if (exists) throw new Error('Email đã được sử dụng.');
      updates.email = normalizedEmail;
    }
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === user.id ? { ...u, ...updates, age: deriveAge(updates.birthDate ?? u.birthDate ?? u.age) } : u));
      persistUsers(next);
      const updated = next.find((u) => u.id === user.id);
      persistSession({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        plan: updated.plan,
        role: updated.role,
        gender: updated.gender,
        birthDate: updated.birthDate,
        age: updated.age,
      });
      return next;
    });
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!user) throw new Error('Chưa đăng nhập');
    if (isWeakPassword(newPassword)) throw new Error('Mật khẩu mới quá yếu.');
    const apiRes = await apiRequest('put', '/api/security/password', { currentPassword, newPassword });
    if (apiRes.ok) {
      return;
    }

    await delay();
    const match = users.find((u) => u.id === user.id);
    if (!match || match.password !== currentPassword) throw new Error(apiRes.error || 'Mật khẩu hiện tại không đúng.');
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u));
      persistUsers(next);
      return next;
    });
  };

  const setUserPlan = async (userId, plan) => {
    const apiRes = await apiRequest('put', `/api/admin/users/${userId}`, { plan });
    if (apiRes.ok && apiRes.data?.user) {
      const updated = normalizeUser(apiRes.data.user);
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
        persistUsers(next);
        if (user?.id === updated.id) {
          persistSession({ ...user, plan: updated.plan });
        }
        return next;
      });
      return;
    }

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === userId ? { ...u, plan } : u));
      persistUsers(next);
      if (user?.id === userId) {
        persistSession({ ...user, plan });
      }
      return next;
    });
  };

  const deleteUser = async (userId) => {
    const apiRes = await apiRequest('delete', `/api/admin/users/${userId}`);
    if (!apiRes.ok && apiRes.error && user?.role === 'admin') {
      // Continue with local removal if API failed.
      console.warn('API delete failed, fallback to local:', apiRes.error);
    }
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      persistUsers(next);
      if (user?.id === userId) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
      return next;
    });
  };

  const refreshUsersFromServer = async () => {
    const res = await apiRequest('get', '/api/admin/users');
    if (res.ok && Array.isArray(res.data?.users)) {
      const normalized = res.data.users.map(normalizeUser);
      setUsers(normalized);
      localStorage.setItem(USERS_KEY, JSON.stringify(normalized));
    }
  };

  const updateUserAdmin = async (userId, payload) => {
    const res = await apiRequest('put', `/api/admin/users/${userId}`, payload);
    if (res.ok && res.data?.user) {
      const updated = normalizeUser(res.data.user);
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
        persistUsers(next);
        if (user?.id === updated.id) {
          persistSession({ ...user, ...updated });
        }
        return next;
      });
      return updated;
    }
    const localUpdated = users.find((u) => u.id === userId);
    if (localUpdated) {
      const merged = normalizeUser({ ...localUpdated, ...payload });
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === merged.id ? merged : u));
        persistUsers(next);
        if (user?.id === merged.id) {
          persistSession({ ...user, ...merged });
        }
        return next;
      });
      return merged;
    }
    throw new Error(res.error || 'Không thể cập nhật người dùng.');
  };

  const value = useMemo(
    () => ({
      user,
      isOpen,
      mode,
      openAuth,
      closeAuth,
      login,
      register,
      socialLogin,
      logout,
      setMode,
      users,
      setUserPlan,
      deleteUser,
      updateProfile,
      changePassword,
      refreshUsersFromServer,
      updateUserAdmin,
    }),
    [user, isOpen, mode, users, refreshUsersFromServer, updateUserAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
