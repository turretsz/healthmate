import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './styles/AuthModal.css';

const isWeakPassword = (value) => {
  if (!value) return true;
  const hasMinLength = value.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const banned = ['123456', 'password', 'qwerty', '111111', '12345678', '123456789'];
  const containsBanned = banned.some((p) => value.toLowerCase().includes(p));
  return !(hasMinLength && hasLetter && hasNumber) || containsBanned;
};

const AuthModal = () => {
  const { isOpen, closeAuth, mode, setMode, login, register } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    gender: 'female',
    birthDate: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({ login: false, register: false });

  useEffect(() => {
    // Clear state when modal closes.
    if (!isOpen) {
      setError('');
      setSubmitting(false);
      setLoginForm({ email: '', password: '' });
      setRegisterForm({ name: '', gender: 'female', birthDate: '', email: '', password: '' });
    }
  }, [isOpen]);

  useEffect(() => setError(''), [mode]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ email: loginForm.email.trim(), password: loginForm.password });
      closeAuth();
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.birthDate) {
      setError('Vui lòng nhập đầy đủ tên và ngày sinh');
      return;
    }
    const birthYear = new Date(registerForm.birthDate).getFullYear();
    if (birthYear < 1900 || birthYear > 2100) {
      setError('Ngày sinh không hợp lệ');
      return;
    }
    if (isWeakPassword(registerForm.password)) {
      setError('Mật khẩu quá yếu. Hãy dùng tối thiểu 8 ký tự, gồm cả chữ và số và không chứa chuỗi dễ đoán.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register({
        name: registerForm.name.trim(),
        gender: registerForm.gender,
        birthDate: registerForm.birthDate,
        email: registerForm.email.trim(),
        password: registerForm.password,
      });
      closeAuth();
    } catch (err) {
      const msg = err?.message || 'Đăng ký chưa thành công, vui lòng thử lại.';
      const friendly = msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('network')
        ? 'Không thể kết nối máy chủ đăng ký. Kiểm tra lại kết nối hoặc API_URL.'
        : msg;
      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = (nextMode) => {
    if (nextMode !== mode) {
      setMode(nextMode);
    }
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="auth-badge">HealthMate</div>
          <h3>Đăng nhập để dùng đầy đủ tính năng</h3>
          <p>Giữ lại lịch sử BMI, BMR, nhịp tim và nước uống. Đồng bộ để xem lại ở mọi thiết bị.</p>
          <ul className="auth-list">
            <li>• Đăng nhập nhanh, bảo vệ thông tin cá nhân</li>
            <li>• Gọn trên điện thoại và máy tính</li>
            <li>• Có nhắc uống nước và theo dõi chỉ số cơ bản</li>
          </ul>
          <div className="auth-hero-meta">
            <div>
              <span className="meta-label">Người dùng</span>
              <strong>12K+</strong>
            </div>
            <div>
              <span className="meta-label">Tỉ lệ hoàn thành</span>
              <strong>98%</strong>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-header">
            <div className="auth-tabs">
              <button className={mode === 'login' ? 'active' : ''} onClick={() => toggleMode('login')}>
                Đăng nhập
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                onClick={() => toggleMode('register')}
              >
                Tạo tài khoản
              </button>
            </div>
            <button className="auth-close" onClick={closeAuth} aria-label="Đóng">✕</button>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label className="auth-field">
                <span className="field-label">Email</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  placeholder="you@email.com"
                />
              </label>
              <label className="auth-field">
                <span className="field-label">Mật khẩu</span>
                <div className="field-control">
                  <input
                    type={showPassword.login ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPassword((prev) => ({ ...prev, login: !prev.login }))}
                  >
                    {showPassword.login ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </label>
              <div className="auth-row">
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="link-button">Quên mật khẩu?</button>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="auth-primary" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-step-title">Tạo tài khoản trong 30 giây</div>
              <p className="auth-muted">Điền thông tin cơ bản để đồng bộ dữ liệu và nhận tư vấn phù hợp.</p>
              <label className="auth-field">
                <span className="field-label">Họ và tên</span>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required
                  placeholder="Nguyễn Văn A"
                />
              </label>
              <div className="auth-field">
                <span className="field-label">Giới tính</span>
                <div className="auth-gender">
                  <button
                    type="button"
                    className={registerForm.gender === 'female' ? 'active' : ''}
                    onClick={() => setRegisterForm({ ...registerForm, gender: 'female' })}
                  >
                    <span role="img" aria-label="Nữ">👩</span> Nữ
                  </button>
                  <button
                    type="button"
                    className={registerForm.gender === 'male' ? 'active' : ''}
                    onClick={() => setRegisterForm({ ...registerForm, gender: 'male' })}
                  >
                    <span role="img" aria-label="Nam">👨‍🦱</span> Nam
                  </button>
                </div>
              </div>
              <label className="auth-field">
                <span className="field-label">Ngày sinh</span>
                <input
                  type="date"
                  value={registerForm.birthDate}
                  onChange={(e) => setRegisterForm({ ...registerForm, birthDate: e.target.value })}
                  required
                  placeholder="YYYY-MM-DD"
                />
              </label>
              <label className="auth-field">
                <span className="field-label">Email</span>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                  placeholder="you@email.com"
                />
              </label>
              <label className="auth-field">
                <span className="field-label">Mật khẩu</span>
                <div className="field-control">
                  <input
                    type={showPassword.register ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPassword((prev) => ({ ...prev, register: !prev.register }))}
                  >
                    {showPassword.register ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="auth-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Tạo tài khoản'}
              </button>
              <button
                type="button"
                className="auth-secondary"
                onClick={() => toggleMode('login')}
                disabled={submitting}
              >
                Đăng nhập bằng tài khoản có sẵn
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
