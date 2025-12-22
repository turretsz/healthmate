// src/components/HeartRateCalculator.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './styles/HeartRateCalculator.css';

const HR_STORAGE = 'hm_hr_logs';
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const MAX_AGE = 120;
const parseAge = (value) => {
  if (value === undefined || value === null) return null;
  const num = parseInt(value, 10);
  if (!Number.isNaN(num) && num > 0 && num <= MAX_AGE) return num;
  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    const today = new Date();
    let age = today.getFullYear() - parsedDate.getFullYear();
    const monthDiff = today.getMonth() - parsedDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate())) age--;
    return age > 0 && age <= MAX_AGE ? age : null;
  }
  return null;
};

const HeartRateCalculator = () => {
  const { user, users } = useAuth();
  const { notify } = useToast();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [resting, setResting] = useState(60);
  const [showResult, setShowResult] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  const userAge = useMemo(() => {
    if (!user) return '';
    const found = users?.find((u) => u.id === user.id);
    return parseAge(found?.age ?? found?.birthDate ?? user?.age ?? user?.birthDate) ?? '';
  }, [user, users]);

  const userGender = useMemo(() => {
    if (!user) return '';
    const found = users?.find((u) => u.id === user.id);
    return found?.gender || user?.gender || '';
  }, [user, users]);

  useEffect(() => {
    if (isSelf && userAge) setAge(userAge);
    if (isSelf && userGender) setGender(userGender);
  }, [isSelf, userAge, userGender]);

  const ageValue = useMemo(() => parseAge(age), [age]);

  const maxHeartRate = useMemo(() => {
    if (!ageValue || ageValue <= 0) return null;
    return 220 - ageValue; // common max HR estimate
  }, [ageValue]);

  const zones = useMemo(() => {
    if (!maxHeartRate) return null;
    const moderateMin = Math.round(maxHeartRate * 0.5);
    const moderateMax = Math.round(maxHeartRate * 0.7);
    const vigorousMin = Math.round(maxHeartRate * 0.7);
    const vigorousMax = Math.round(maxHeartRate * 0.85);
    return { moderateMin, moderateMax, vigorousMin, vigorousMax };
  }, [maxHeartRate]);

  const handleSubmit = () => {
    window.dispatchEvent(new CustomEvent('hm-busy', { detail: { duration: 600 } }));
    if (!ageValue || !resting || resting <= 0) {
      notify('Vui lòng nhập tuổi và nhịp tim nghỉ ngơi.', { type: 'warning' });
      return;
    }
    if (resting < 30 || resting > 120) {
      notify('Vui lòng nhập nhịp tim nghỉ ngơi trong khoảng 30-120 bpm.', { type: 'warning' });
      return;
    }
    setShowResult(true);
    if (user?.id && maxHeartRate && zones) {
      try {
        const payload = {
          bpm: resting,
          max: maxHeartRate,
          moderate: `${zones.moderateMin}-${zones.moderateMax} bpm`,
          vigorous: `${zones.vigorousMin}-${zones.vigorousMax} bpm`,
          zone: 'Vận động',
          duration: '',
          mode: 'cardio',
          ts: Date.now(),
        };
        const raw = localStorage.getItem(HR_STORAGE);
        const parsed = raw ? JSON.parse(raw) : {};
        const list = Array.isArray(parsed[user.id]) ? parsed[user.id] : [];
        const next = [payload, ...list].slice(0, 30);
        localStorage.setItem(HR_STORAGE, JSON.stringify({ ...parsed, [user.id]: next }));
        window.dispatchEvent(new Event('hm-data-updated'));
      } catch (err) {
        // ignore storage errors
      }
    }
  };

  return (
    <div className="hr-page">
      <div className="hr-layout">
        <div className="hr-breadcrumb">
          <Link className="crumb-link home" to="/">🏠</Link>
          <Link className="crumb-link" to="/">Công cụ kiểm tra sức khỏe</Link>
          <span className="crumb">Công cụ tính nhịp tim lý tưởng</span>
        </div>

        <div className="hr-hero">
          <div>
            <h1>Công cụ tính nhịp tim lý tưởng</h1>
            <p>Tìm hiểu nhịp tim nghỉ ngơi bình thường và nhịp tim tối đa trong độ tuổi của bạn cũng như cường độ tập thể dục và các yếu tố khác ảnh hưởng đến nhịp tim như thế nào.</p>
            <div className="hr-meta">Tham vấn y khoa: Thạc sĩ - Bác sĩ CKI Ngô Võ Ngọc Hương • 27/09/2021</div>
          </div>
          <div className="hr-hero-icon" aria-hidden>❤️</div>
        </div>

        <div className="hr-main">
          <div className="hr-card">
            <div className="hr-row">
              <div className="field">
                <label>Tuổi của bạn</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_AGE}
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setAge('');
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (Number.isNaN(num)) return;
                    const clamped = Math.min(MAX_AGE, Math.max(1, num));
                    setAge(String(clamped));
                  }}
                  placeholder="Ví dụ: 30"
                  readOnly={isSelf && !!userAge}
                />
              </div>
              <div className="field inline">
                <span>Bạn đang tính chỉ số cho chính mình?</span>
                <button
                  type="button"
                  className={`pill-toggle ${isSelf ? 'active' : 'inactive'}`}
                  onClick={() => setIsSelf((prev) => !prev)}
                >
                  {isSelf ? 'Có' : 'Không'}
                </button>
              </div>
            </div>

            <div className="hr-row">
              <div className="field">
                <label>Giới tính của bạn</label>
                <div className="button-row">
                  <button
                    type="button"
                    className={`pill ${gender === 'male' ? 'pill-active' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    👨 Nam
                  </button>
                  <button
                    type="button"
                    className={`pill ${gender === 'female' ? 'pill-active' : ''}`}
                    onClick={() => setGender('female')}
                  >
                    👩 Nữ
                  </button>
                </div>
              </div>
            </div>

            <div className="field">
              <label>Nhịp tim nghỉ ngơi của bạn là bao nhiêu? (bpm)</label>
              <div className="slider-row">
                <button
                  type="button"
                  className="slider-btn"
                  onClick={() => setResting((prev) => clamp(prev - 1, 30, 120))}
                >
                  -
                </button>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={resting}
                  onChange={(e) => setResting(parseInt(e.target.value || '0', 10))}
                />
                <button
                  type="button"
                  className="slider-btn"
                  onClick={() => setResting((prev) => clamp(prev + 1, 30, 120))}
                >
                  +
                </button>
              </div>
              <div className="slider-value">{resting} bpm</div>
              <div className="slider-helper">Làm sao để đo nhịp tim nghỉ ngơi?</div>
            </div>

            <button className="hr-submit" type="button" onClick={handleSubmit}>Tính ngay</button>
          </div>

          <div className="hr-results">
            {showResult ? (
              <>
                <div className="hr-metrics">
                  <div className="metric">
                    <div className="metric-title">Nhịp tim tối đa ước tính</div>
                    <div className="metric-value">{maxHeartRate || '--'} bpm</div>
                    <div className="metric-note">Công thức: 220 - tuổi</div>
                  </div>
                  <div className="metric">
                    <div className="metric-title">Vùng nhịp tim lý tưởng</div>
                    <div className="metric-value">
                      {zones ? `${zones.moderateMin}-${zones.vigorousMax} bpm` : '--'}
                    </div>
                    <div className="metric-note">50-85% nhịp tim tối đa</div>
                  </div>
                </div>
                {zones && (
                  <div className="zones-card">
                    <div className="zone-row">
                      <span className="zone-dot mod" />
                      <span className="zone-text">Vùng vận động vừa (50-70%): {zones.moderateMin}-{zones.moderateMax} bpm</span>
                    </div>
                    <div className="zone-row">
                      <span className="zone-dot vig" />
                      <span className="zone-text">Vùng vận động mạnh (70-85%): {zones.vigorousMin}-{zones.vigorousMax} bpm</span>
                    </div>
                    <div className="zone-row">
                      <span className="zone-dot rest" />
                      <span className="zone-text">Nhịp tim nghỉ của bạn: {resting} bpm</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="hr-placeholder">
                <div className="placeholder-title">Chưa có kết quả</div>
                <p className="placeholder-desc">Điền tuổi, giới tính và nhịp tim nghỉ, sau đó nhấn “Tính ngay” để xem vùng nhịp tim.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateCalculator;
