// src/components/Header.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './styles/Header.css';

const Header = ({ featureFlags = {} }) => {
  const { user, openAuth, logout } = useAuth();
  const { notify } = useToast();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLocked = (e) => {
    e.preventDefault();
    notify('Chức năng đang trong quá trình phát triển, vui lòng quay lại sau.', { type: 'info' });
  };

  const links = [
    { to: '/', label: 'Trang chủ', locked: false },
    { to: '/health-tracker', label: 'BMI', locked: false },
    { to: '/profile', label: 'Hồ sơ', locked: false },
    { to: '/dashboard', label: 'Nhật ký', locked: !featureFlags.dashboard },
    { to: '/bmr', label: 'BMR & TDEE', locked: !featureFlags.bmr },
    { to: '/heart-rate', label: 'Nhịp tim', locked: !featureFlags.heart },
  ];

  return (
    <header className="header glass-bar">
      <div className="page-width header-inner">
        <Link to="/" className="logo-link" aria-label="Trang chủ">
          <div className="logo">
            <span className="logo-icon">HM</span>
            <div className="logo-text">
              <span className="brand-name">HealthMate</span>
              <span className="brand-sub">Studio sức khỏe</span>
            </div>
          </div>
        </Link>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          {links.map((item) => {
            const isActive = pathname === item.to;
            const classes = `nav-link ${isActive ? 'active' : ''} ${item.locked ? 'locked' : ''}`;
            const content = item.label;
            if (item.locked) {
              return (
                <a
                  key={item.to}
                  href={item.to}
                  className={classes}
                  onClick={handleLocked}
                  aria-disabled="true"
                >
                  {content}
                </a>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={classes}
                onClick={() => setMenuOpen(false)}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <button
            className="nav-toggle"
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Mở menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          {user ? (
            <div className="user-chip">
              <span className="user-avatar" aria-hidden>👤</span>
              <Link to="/profile" className="user-name">{user.name}</Link>
              <button className="logout-btn" onClick={logout}>Thoát</button>
            </div>
          ) : (
            <button className="login-button" onClick={() => openAuth('login')}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
