// src/App.js
import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ToolCards from './components/HealthTools';
import ToolSection from './components/ToolSection';
import HealthTracker from './components/HealthTracker';
import BMRCalculator from './components/BMRCalculator';
import HeartRateCalculator from './components/HeartRateCalculator';
import WellnessDashboard from './components/WellnessDashboard';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import './components/styles/Header.css';
import './App.css';
import Profile from './components/Profile';
import { useAuth } from './context/AuthContext';

const FEATURE_KEY = 'hm_feature_flags';
const defaultFeatures = { dashboard: false, bmr: false, heart: false };
const defaultActionSuggestions = [
  { name: 'Uống nước', note: 'Bổ sung 300ml nước sau khi thức dậy.', delta: '+300ml' },
  { name: 'Vận động', note: 'Đi bộ nhanh 10 phút sau bữa trưa.', delta: '+10 phút' },
  { name: 'Giãn cơ', note: 'Duỗi vai/cổ 2 phút khi ngồi lâu.', delta: '+2 phút' },
];

const HomePage = ({ onLockedClick, bmiSnapshot, bmrSnapshot, hrSnapshot, statusSnapshot, actions, featureFlags }) => {
  const canDashboard = !!featureFlags?.dashboard;
  const canBmr = !!featureFlags?.bmr;
  const canHeart = !!featureFlags?.heart;
  const showActions = canDashboard && actions?.length;

  return (
  <div className="app-shell">
    <section className="hero-shell">
      <div className="page-width hero-grid">
        <div className="hero-primary">
          <div className="eyebrow-chip">Trung tâm sức khỏe cá nhân</div>
          <h1 className="hero-title">
            HealthMate Studio
            <br />
            Đồng hành từng nhịp, chăm trọn sức khỏe.
          </h1>
          <p className="hero-subtitle">
            Một bảng điều khiển duy nhất cho BMI, BMR, nhịp tim, lịch uống nước và hành trình luyện tập. Tất cả được gom vào luồng thao tác nhanh, nhìn là hiểu, làm là xong.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" onClick={!canDashboard ? onLockedClick : undefined} className="btn btn-primary">Mở bảng điều khiển</Link>
            <Link to="/health-tracker" className="btn btn-ghost">Kiểm tra BMI</Link>
            <div className="micro-badge">Đăng nhập để đồng bộ • Lưu online</div>
          </div>
          <div className="hero-pills">
            <span className="hero-pill accent">3 bước • Điền số liệu</span>
            <span className="hero-pill">Xem kết quả trực quan</span>
            <span className="hero-pill ghost">Lưu & nhắc nhở ngay</span>
          </div>

            <div className="hero-metrics-grid">
              <div className="metric-card large">
                <div className="metric-label">Luồng chính</div>
                <div className="metric-value">Chỉ số & hồ sơ sức khỏe</div>
                <p className="metric-note">Tập trung vào BMI, nhịp tim, nhật ký để theo dõi sức khỏe.</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">BMI nhanh</div>
                <div className="metric-value accent">{bmiSnapshot?.value ?? '--'}</div>
                <p className="metric-note">
                  {bmiSnapshot?.note || 'Nhập chiều cao/cân nặng và xem ngay kết quả.'}
                </p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Hồ sơ</div>
                <div className="metric-value accent">Thông tin cá nhân</div>
                <p className="metric-note">Cập nhật và đồng bộ thông tin khi bạn đăng nhập.</p>
              </div>
            </div>
        </div>

        <div className="hero-secondary">
          <div className="panel board">
            <div className="panel-head">
              <div>
                <p className="panel-subtitle">Ảnh chụp hiện tại</p>
                <div className="panel-title">Wellness radar</div>
              </div>
              <span className="live-pill">Realtime</span>
            </div>

            <div className="insight-grid">
              <div className="insight-card highlight">
                <div className="insight-label">BMI</div>
                <div className="insight-value">{bmiSnapshot?.value ?? '--'}</div>
                <p className="insight-note">{bmiSnapshot?.note || 'Hãy đo BMI để đồng bộ tài khoản.'}</p>
                <div className="bar">
                  <span style={{ width: `${bmiSnapshot?.barWidth ?? 0}%` }} />
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">BMR</div>
                <div className="insight-value">{canBmr ? (bmrSnapshot?.value || '~') : '~'}</div>
                <p className="insight-note">{canBmr ? (bmrSnapshot?.note || 'Chưa có dữ liệu.') : 'Chức năng đang trong quá trình phát triển.'}</p>
              </div>
              <div className="insight-card">
                <div className="insight-label">Nhịp tim</div>
                <div className="insight-value">{canHeart ? (hrSnapshot?.value || '~') : '~'}</div>
                <p className="insight-note">{canHeart ? (hrSnapshot?.note || 'Chưa có dữ liệu.') : 'Chức năng đang trong quá trình phát triển.'}</p>
              </div>
              <div className="insight-card secondary">
                <div className="insight-label">Trạng thái</div>
                <div className="insight-value">{canDashboard ? (statusSnapshot?.value || '~') : '~'}</div>
                <p className="insight-note">{canDashboard ? (statusSnapshot?.note || 'Chưa có dữ liệu.') : 'Chức năng đang trong quá trình phát triển.'}</p>
              </div>
            </div>
          </div>

          <div className="panel sessions board">
            <div className="panel-head">
              <div>
                <p className="panel-subtitle">Nhật ký mới nhất</p>
                <div className="panel-title">Bảng lịch hành động</div>
              </div>
              <Link to="/dashboard" onClick={!canDashboard ? onLockedClick : undefined} className="link-inline">Mở nhật ký</Link>
            </div>
            <div className="session-list">
              {(showActions ? actions : [{ name: '~', note: 'Nhật ký đang trong quá trình phát triển, chưa có dữ liệu.', delta: '~' }]).map((item, idx) => (
                <div className="session-row" key={`${item.name}-${idx}`}>
                  <div>
                    <div className="session-name">{item.name || '~'}</div>
                    <p className="session-note">{item.note || 'Chưa có dữ liệu.'}</p>
                  </div>
                  <span className="session-chip neutral">{item.delta || '~'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="page-width">
        <div className="lanes">
          <div className="lane-card">
            <p className="section-kicker">Lộ trình trong ngày</p>
            <h2 className="section-title">Bước đi rõ ràng, ít phải suy nghĩ</h2>
            <p className="section-sub">
              Bảng điều khiển được chia thành 3 đường: đo nhanh, xem báo cáo và ghi chú. Mỗi đường đều có nhắc nhở và mốc hành động.
            </p>
            <div className="lane-list">
              <div className="lane-item">
                <span className="dot green" />
                <div>
                  <div className="lane-title">Nhập số liệu tức thì</div>
                  <p className="lane-note">BMI, BMR, nhịp tim trong cùng một khu vực.</p>
                </div>
              </div>
              <div className="lane-item">
                <span className="dot amber" />
                <div>
                  <div className="lane-title">Đọc kết quả trực quan</div>
                  <p className="lane-note">Thang đo, vùng tim, khuyến nghị ăn uống.</p>
                </div>
              </div>
              <div className="lane-item">
                <span className="dot mint" />
                <div>
                  <div className="lane-title">Lưu và nhắc</div>
                  <p className="lane-note">Nhật ký nước, ngủ, vận động được gom chung.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lane-tiles">
            <div className="tile">
              <p className="tile-label">Nhịp làm việc</p>
              <div className="tile-value">Sáng • Trưa • Tối</div>
              <p className="tile-note">Mỗi khung giờ có checklist riêng.</p>
            </div>
            <div className="tile">
              <p className="tile-label">Thông tin cốt lõi</p>
              <div className="tile-value">BMI • BMR • HR</div>
              <p className="tile-note">Không cần tìm kiếm nhiều trang.</p>
            </div>
            <div className="tile wide">
              <p className="tile-label">Ghi chú nhanh</p>
              <div className="tile-value">Hydrate 300ml mỗi 60 phút</div>
              <p className="tile-note">Đặt nhắc di chuyển và chốt giờ ngủ.</p>
            </div>
          </div>
        </div>

        <div className="section-heading">
          <div>
            <p className="section-kicker">Trạm kiểm tra nhanh</p>
            <h2 className="section-title">Công cụ trọng tâm trong một khung nhìn</h2>
            <p className="section-sub">Ưu tiên thao tác trực tiếp, giảm độ rườm rà và đảm bảo kết quả hiển thị rõ ràng.</p>
          </div>
          <div className="pill-filter">Realtime • Không cần tài khoản</div>
        </div>
        <ToolCards featureFlags={featureFlags} />
      </div>
    </section>

    <section className="section">
      <div className="page-width">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Lộ trình chăm sóc</p>
            <h2 className="section-title">Xây dựng thói quen khoa học</h2>
            <p className="section-sub">Từ kiểm tra cơ bản tới tối ưu hiệu suất, mọi bước đều được gợi ý cách hành động.</p>
          </div>
          <div className="pill-filter soft">Nhắc nhở • Theo dõi tuần</div>
        </div>
        <ToolSection />
      </div>
    </section>

    <section className="section">
      <div className="page-width">
        <div className="cta-banner">
          <div>
            <p className="section-kicker">Sẵn sàng bắt đầu?</p>
            <h2 className="section-title">HealthMate đồng hành dài hạn</h2>
            <p className="section-sub">
              Lưu chỉ số, đặt nhắc nước/di chuyển, xem nhịp tim và calo ngay trong trình duyệt. Bố cục mới ưu tiên tốc độ, dễ đọc và dễ hành động.
            </p>
          </div>
          <div className="cta-actions">
            <Link to="/dashboard" onClick={!featureFlags?.dashboard ? onLockedClick : undefined} className="btn btn-primary">Mở bảng điều khiển</Link>
            <Link to="/bmr" onClick={!featureFlags?.bmr ? onLockedClick : undefined} className="btn btn-ghost">Tính BMR ngay</Link>
          </div>
        </div>
      </div>
    </section>
  </div>
  );
};

const LockedFeature = ({ label }) => (
  <div className="locked-feature">
    <div className="page-width">
      <div className="locked-card">
        <h1>{label} đang trong quá trình phát triển</h1>
        <p>Chức năng này đang được hoàn thiện. Vui lòng quay lại sau.</p>
        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    </div>
  </div>
);

function AppShell() {
  const { notify } = useToast();
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('hm_theme') || 'dark');
  const { pathname } = useLocation();
  const [isRouting, setIsRouting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [featureFlags, setFeatureFlags] = useState(() => {
    try {
      const raw = localStorage.getItem(FEATURE_KEY);
      return raw ? { ...defaultFeatures, ...JSON.parse(raw) } : defaultFeatures;
    } catch (err) {
      return defaultFeatures;
    }
  });
  const [snapshots, setSnapshots] = useState({
    bmi: null,
    bmr: null,
    hr: null,
    status: null,
    actions: [
      { name: '~', note: 'Nhật ký đang khóa, chưa có dữ liệu.', delta: '~' },
    ],
  });
  const handleLockedClick = useCallback((e) => {
    e.preventDefault();
    notify('Chức năng đang trong quá trình phát triển, vui lòng quay lại sau.', { type: 'info' });
  }, [notify]);

  const handleFeatureToggle = useCallback((key, value) => {
    setFeatureFlags((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(FEATURE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const classifyBmi = useCallback((value) => {
    const bmiNum = parseFloat(value);
    if (!bmiNum) return { label: 'Chưa có dữ liệu', note: 'Hãy đo BMI để xem gợi ý.', barWidth: 0 };
    if (bmiNum < 18.5) return { label: 'Thiếu cân', note: 'Tăng nhẹ khẩu phần và tập sức mạnh.', barWidth: Math.min(100, Math.max(10, (bmiNum / 35) * 100)) };
    if (bmiNum < 23) return { label: 'Khỏe mạnh', note: 'Duy trì dinh dưỡng cân bằng và ngủ đủ.', barWidth: Math.min(100, Math.max(10, (bmiNum / 35) * 100)) };
    if (bmiNum < 25) return { label: 'Thừa cân nhẹ', note: 'Ưu tiên cardio nhẹ và kiểm soát khẩu phần.', barWidth: Math.min(100, Math.max(10, (bmiNum / 35) * 100)) };
    if (bmiNum < 30) return { label: 'Béo phì độ 1', note: 'Cắt giảm calo rỗng, tăng vận động và ngủ sớm.', barWidth: Math.min(100, Math.max(10, (bmiNum / 35) * 100)) };
    return { label: 'Béo phì độ 2+', note: 'Tham vấn chuyên gia, thiết lập kế hoạch dinh dưỡng và vận động an toàn.', barWidth: 100 };
  }, []);

  const formatNumber = (num, digits = 0, suffix = '') => {
    if (num === null || num === undefined || Number.isNaN(num)) return '~';
    return `${Number(num).toLocaleString('vi-VN', { maximumFractionDigits: digits })}${suffix}`;
  };

  const loadSnapshots = useCallback(() => {
    if (!user?.id) {
      setSnapshots((prev) => ({
        ...prev,
        bmi: null,
        bmr: null,
        hr: null,
        status: null,
        actions: [{ name: '~', note: 'Nhật ký đang trong quá trình phát triển, chưa có dữ liệu.', delta: '~' }],
      }));
      return;
    }
    try {
      const rawBmi = localStorage.getItem('hm_bmi_logs');
      const rawBmr = localStorage.getItem('hm_bmr_logs');
      const rawHr = localStorage.getItem('hm_hr_logs');
      const rawStatus = localStorage.getItem('hm_status_snapshot');
      const rawActions = localStorage.getItem('hm_action_logs');

      const bmiMap = rawBmi ? JSON.parse(rawBmi) : {};
      const bmrMap = rawBmr ? JSON.parse(rawBmr) : {};
      const hrMap = rawHr ? JSON.parse(rawHr) : {};
      const statusMap = rawStatus ? JSON.parse(rawStatus) : {};
      const actionsMap = rawActions ? JSON.parse(rawActions) : {};

      const latestBmi = Array.isArray(bmiMap[user.id]) ? bmiMap[user.id][0] : null;
      const latestBmr = Array.isArray(bmrMap[user.id]) ? bmrMap[user.id][0] : null;
      const latestHr = Array.isArray(hrMap[user.id]) ? hrMap[user.id][0] : null;
      const statusSnap = statusMap[user.id] || null;
      const actionsList = Array.isArray(actionsMap[user.id]) ? actionsMap[user.id].slice(0, 3) : [];

      const bmiMeta = latestBmi ? classifyBmi(latestBmi.bmi) : null;

      setSnapshots({
        bmi: latestBmi
          ? {
              value: latestBmi.bmi,
              note: `${bmiMeta?.label ?? '---'} • ${bmiMeta?.note ?? ''}`.trim(),
              barWidth: bmiMeta?.barWidth ?? 0,
            }
          : null,
        bmr: latestBmr
          ? {
              value: formatNumber(latestBmr.bmr, 0, ' kcal'),
              note: `TDEE: ${formatNumber(latestBmr.tdee, 0, ' kcal')}${latestBmr.activityLabel ? ` • ${latestBmr.activityLabel}` : ''}`,
            }
          : null,
        hr: latestHr
          ? {
              value: formatNumber(latestHr.bpm, 0, ' bpm'),
              note: `${latestHr.zone || '---'}${latestHr.duration ? ` • ${latestHr.duration}` : ''}${latestHr.mode ? ` • ${latestHr.mode}` : ''}`,
            }
          : null,
        status: statusSnap
          ? {
              value: statusSnap.label || 'On track',
              note: statusSnap.note || 'Đang đồng bộ dữ liệu.',
            }
          : null,
        actions: actionsList.length ? actionsList : defaultActionSuggestions,
      });
    } catch (err) {
      setSnapshots((prev) => ({
        ...prev,
        bmi: null,
        bmr: null,
        hr: null,
        status: null,
        actions: defaultActionSuggestions,
      }));
    }
  }, [user, classifyBmi]);

  useEffect(() => {
    setIsRouting(true);
    const timeout = setTimeout(() => setIsRouting(false), 450);
    return () => clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    const handleBusy = (e) => {
      const duration = e?.detail?.duration ?? 500;
      setIsBusy(true);
      setTimeout(() => setIsBusy(false), duration);
    };
    window.addEventListener('hm-busy', handleBusy);
    return () => window.removeEventListener('hm-busy', handleBusy);
  }, []);

  useEffect(() => {
    loadSnapshots();
    const onStorage = (e) => {
      if (['hm_bmi_logs', 'hm_bmr_logs', 'hm_hr_logs', 'hm_status_snapshot', 'hm_action_logs'].includes(e.key)) {
        loadSnapshots();
      }
      if (e.key === FEATURE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFeatureFlags({ ...defaultFeatures, ...parsed });
        } catch (err) {
          setFeatureFlags(defaultFeatures);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('hm-data-updated', loadSnapshots);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hm-data-updated', loadSnapshots);
    };
  }, [loadSnapshots]);

  useEffect(() => {
    localStorage.setItem('hm_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`font-sans theme-${theme}`}>
      <Header theme={theme} toggleTheme={toggleTheme} featureFlags={featureFlags} />
      <div className="page-transition">
        <Routes>
          <Route
            path="/"
            element={(
              <HomePage
                onLockedClick={handleLockedClick}
                bmiSnapshot={snapshots.bmi}
                bmrSnapshot={snapshots.bmr}
                hrSnapshot={snapshots.hr}
                statusSnapshot={snapshots.status}
                actions={snapshots.actions}
                featureFlags={featureFlags}
              />
            )}
          />
          <Route
            path="/dashboard"
            element={featureFlags.dashboard ? <WellnessDashboard /> : <LockedFeature label="Nhật ký" />}
          />
          <Route path="/health-tracker" element={<HealthTracker />} />
          <Route path="/bmr" element={featureFlags.bmr ? <BMRCalculator /> : <LockedFeature label="BMR & TDEE" />} />
          <Route path="/heart-rate" element={featureFlags.heart ? <HeartRateCalculator /> : <LockedFeature label="Nhịp tim" />} />
          <Route path="/profile" element={<Profile featureFlags={featureFlags} onToggleFeature={handleFeatureToggle} />} />
          <Route
            path="*"
            element={(
              <HomePage
                onLockedClick={handleLockedClick}
                bmiSnapshot={snapshots.bmi}
                bmrSnapshot={snapshots.bmr}
                hrSnapshot={snapshots.hr}
                statusSnapshot={snapshots.status}
                actions={snapshots.actions}
                featureFlags={featureFlags}
              />
            )}
          />
        </Routes>
      </div>
      <AuthModal />
      <div className={`page-loader ${(isRouting || isBusy) ? 'show' : ''}`}>
        <div className="loader-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="loader-label">Đang tải nội dung...</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
