// src/components/HealthTracker.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import './styles/HealthTracker.css';

const BMI_STORAGE = 'hm_bmi_logs';
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 250;
const MIN_WEIGHT = 20;
const MAX_WEIGHT = 250;
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

const infoItems = [
  {
    title: 'Chỉ số BMI là gì? - Định nghĩa chỉ số khối cơ thể BMI',
    content:
      'Chỉ số khối cơ thể (BMI) là phép đo trọng lượng của một người tương ứng với chiều cao. BMI giúp nhận biết mức cân nặng bình thường, thừa cân hay thiếu cân để điều chỉnh lối sống.',
  },
  {
    title: 'Giải thích chỉ số BMI',
    content:
      'BMI không đo trực tiếp mỡ cơ thể nhưng có tương quan với lượng mỡ. BMI cao thường gợi ý thừa cân; BMI thấp gợi ý thiếu cân. Đối với trẻ em và thanh thiếu niên, BMI được diễn giải theo tuổi và giới.',
  },
  {
    title: 'Công thức tính BMI là gì?',
    content:
      'BMI = Cân nặng (kg) / [Chiều cao (m)]². Ví dụ: 60 kg và 1,7 m => BMI = 60 / (1,7 × 1,7) ≈ 20,8.',
  },
  {
    title: 'Tại sao bạn nên biết về chỉ số BMI?',
    content:
      'Theo dõi BMI giúp quản lý cân nặng và phát hiện sớm nguy cơ sức khỏe liên quan đến thừa cân hoặc thiếu cân như đái tháo đường type 2, bệnh tim mạch hay thiếu dinh dưỡng.',
  },
  {
    title: 'Chỉ số BMI cao có gây nguy hiểm nghiêm trọng đến sức khỏe không?',
    content:
      'BMI cao có thể liên quan đến nguy cơ tăng huyết áp, đái tháo đường type 2, bệnh tim mạch, đột quỵ và một số ung thư. Cần tham khảo chuyên gia để được đánh giá toàn diện.',
  },
  {
    title: 'Những nguy cơ gây béo phì bạn cần nắm',
    content:
      'Béo phì có thể tăng nguy cơ tiểu đường type 2, bệnh tim mạch, ngưng thở khi ngủ, viêm khớp, gan nhiễm mỡ và rối loạn tâm lý. Kiểm soát chế độ ăn và vận động là chìa khóa.',
  },
  {
    title: 'Những nguy cơ gây thiếu cân bạn cần nắm',
    content:
      'Thiếu cân có thể dẫn đến suy dinh dưỡng, loãng xương, thiếu máu, giảm miễn dịch, vấn đề sinh sản và phục hồi sau bệnh kém. Cần bổ sung dinh dưỡng hợp lý và theo dõi sức khỏe.',
  },
  {
    title: 'Chỉ số BMI có phải là một chỉ số tốt để đánh giá lượng mỡ trong cơ thể?',
    content:
      'BMI hữu ích để sàng lọc nhưng không phân biệt khối lượng cơ và mỡ. Vận động viên có thể BMI cao nhưng mỡ thấp; người lớn tuổi có BMI bình thường nhưng mỡ cao. Cần kết hợp vòng eo, thành phần cơ thể.',
  },
  {
    title: 'Nguồn tham khảo',
    content:
      'CDC, WHO, NHS và các hướng dẫn dinh dưỡng quốc gia về đánh giá cân nặng và sức khỏe. Ngày truy cập: 18.11.2022.',
  },
];

const classifyBmi = (value) => {
  if (!value) return null;
  const bmiNum = parseFloat(value);
  if (bmiNum < 18.5) return { label: 'Thiếu cân', badge: 'Thiếu cân', color: '#22c55e' };
  if (bmiNum < 23) return { label: 'Khỏe mạnh', badge: 'Khỏe mạnh', color: '#16a34a' };
  if (bmiNum < 25) return { label: 'Thừa cân', badge: 'Thừa cân', color: '#f59e0b' };
  if (bmiNum < 30) return { label: 'Béo phì độ 1', badge: 'Béo phì độ 1', color: '#f97316' };
  if (bmiNum < 35) return { label: 'Béo phì độ 2', badge: 'Béo phì độ 2', color: '#ef4444' };
  return { label: 'Béo phì độ 3', badge: 'Béo phì độ 3', color: '#b91c1c' };
};

const HealthTracker = () => {
  const { user, users } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isSelf, setIsSelf] = useState(false);
  const [bmiHistory, setBmiHistory] = useState([]);
  const [chartRange, setChartRange] = useState('week'); // day | week | month
  const chartRef = useRef(null);

  const saveBmiForUser = useCallback((userId, entry) => {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(BMI_STORAGE);
      const parsed = raw ? JSON.parse(raw) : {};
      const existing = Array.isArray(parsed[userId]) ? parsed[userId] : [];
      const datedEntry = { ...entry, ts: Date.now(), date: new Date().toISOString().slice(0, 10) };
      const next = [datedEntry, ...existing].slice(0, 50);
      const merged = { ...parsed, [userId]: next };
      localStorage.setItem(BMI_STORAGE, JSON.stringify(merged));
      setBmiHistory(next);
      return next;
    } catch (err) {
      // best-effort; bỏ qua lỗi lưu
      return [];
    }
  }, []);

  const readLocalHistory = useCallback(() => {
    if (!user?.id) return [];
    try {
      const raw = localStorage.getItem(BMI_STORAGE);
      const parsed = raw ? JSON.parse(raw) : {};
      return Array.isArray(parsed[user.id]) ? parsed[user.id] : [];
    } catch (e) {
      return [];
    }
  }, [user?.id]);

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
    const fetchHistory = async () => {
      if (!user?.id) {
        setBmiHistory([]);
        return;
      }
      const res = await apiRequest('get', '/api/metrics/bmi');
      if (res.ok && Array.isArray(res.data?.logs)) {
        setBmiHistory(res.data.logs);
      } else {
        setBmiHistory(readLocalHistory());
      }
    };
    fetchHistory();
  }, [user?.id, readLocalHistory]);

  const chartPoints = useMemo(() => {
    const history = bmiHistory.length ? bmiHistory : readLocalHistory();
    const resolveDate = (log) => {
      if (log.date) return log.date;
      if (log.recordedAt) return log.recordedAt.slice(0, 10);
      if (log.ts) return new Date(log.ts).toISOString().slice(0, 10);
      return null;
    };
    const rangeDays = chartRange === 'day' ? 1 : chartRange === 'month' ? 30 : 7;
    const buckets = [];
    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = history.find((log) => resolveDate(log) === key);
      buckets.push({
        date: key,
        label: key.slice(5).replace('-', '/'),
        bmi: found?.bmi ?? null,
      });
    }
    const maxBmi = Math.max(...buckets.map((b) => b.bmi || 0), 35);
    return buckets.map((b) => ({
      ...b,
      max: maxBmi,
      height: b.bmi ? Math.max(8, Math.round((b.bmi / maxBmi) * 100)) : 4,
    }));
  }, [bmiHistory, chartRange, readLocalHistory]);

  const triggerBusy = () => window.dispatchEvent(new CustomEvent('hm-busy', { detail: { duration: 600 } }));

  useEffect(() => {
    if (isSelf && userAge) {
      setAge(userAge);
    }
    if (isSelf && userGender) {
      setGender(userGender);
    }
  }, [isSelf, userAge, userGender]);

  const calculateBMI = async () => {
    triggerBusy();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const ageValue = parseAge(age);
    if (!ageValue || !h || !w) {
      notify('Vui lòng nhập đầy đủ tuổi, chiều cao và cân nặng.', { type: 'warning' });
      return;
    }
    if (h < MIN_HEIGHT || h > MAX_HEIGHT || w < MIN_WEIGHT || w > MAX_WEIGHT) {
      notify(`Vui lòng nhập chiều cao (${MIN_HEIGHT}-${MAX_HEIGHT} cm) và cân nặng (${MIN_WEIGHT}-${MAX_WEIGHT} kg) trong giới hạn hợp lý.`, { type: 'warning' });
      return;
    }
    const bmiValue = w / Math.pow(h / 100, 2);
    setBmi(bmiValue.toFixed(1));
    setShowResult(true);
    setShowForm(false);
    if (user?.id) {
      const entry = {
        bmi: parseFloat(bmiValue.toFixed(1)),
        height: h,
        weight: w,
        gender,
        age: ageValue,
      };
      const localLogs = saveBmiForUser(user.id, entry);
      const res = await apiRequest('post', '/api/metrics/bmi', entry);
      if (res.ok && Array.isArray(res.data?.logs)) {
        setBmiHistory(res.data.logs);
      } else {
        setBmiHistory(localLogs);
      }
      // Thông báo ứng dụng cập nhật để trang chủ/snapshot đồng bộ ngay.
      window.dispatchEvent(new Event('hm-data-updated'));
    }
    setTimeout(() => {
      if (chartRef.current) chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleReset = () => {
    setShowResult(false);
    setShowForm(true);
    setBmi(null);
    setOpenIndex(null);
    setHeight('');
    setWeight('');
    window.dispatchEvent(new CustomEvent('hm-busy', { detail: { duration: 400 } }));
  };

  return (
    <div className="bmi-page">
      <div className="bmi-layout">
        <div className="bmi-breadcrumb">
          <Link className="crumb-link home" to="/">🏠</Link>
          <Link className="crumb-link" to="/">Công cụ kiểm tra sức khỏe</Link>
          <span className="crumb">Tính chỉ số BMI - Chỉ số khối cơ thể</span>
        </div>

        {!showResult && (
          <div className="bmi-columns">
            <div className="bmi-card form-card">
              <div className="bmi-header">
                <h1>Đo chỉ số BMI</h1>
                <div className="bmi-expert">
                  <img src="https://cdn-icons-png.flaticon.com/512/2922/2922656.png" alt="Chuyên gia" />
                  <div>
                    <div className="expert-line">Tham vấn y khoa: Chuyên gia dinh dưỡng Phạm Thị Diệp</div>
                    <div className="expert-date">30/09/2023</div>
                  </div>
                </div>
              </div>

              <form className="bmi-form" onSubmit={(e) => e.preventDefault()}>
                <label className="field-label" htmlFor="age">Tuổi của bạn</label>
                <div className="input-shell">
                  <input
                    id="age"
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

                <div className="question inline">
                  <div className="field-label">Bạn đang tính chỉ số cho chính mình?</div>
                  <button
                    type="button"
                    className={`toggle-chip ${isSelf ? 'active' : 'inactive'}`}
                    onClick={() => setIsSelf((prev) => !prev)}
                  >
                    {isSelf ? 'Có' : 'Không'}
                  </button>
                </div>

                <label className="field-label">Giới tính của bạn</label>
                <div className="button-row">
                  <button
                    type="button"
                    className={`pill ${gender === 'male' ? 'pill-active' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    <span role="img" aria-label="Nam">👨‍🦱</span> Nam
                  </button>
                  <button
                    type="button"
                    className={`pill ${gender === 'female' ? 'pill-active' : ''}`}
                    onClick={() => setGender('female')}
                  >
                    <span role="img" aria-label="Nữ">👩</span> Nữ
                  </button>
                </div>

                <div className="double-row">
                  <div className="input-col">
                    <label className="field-label" htmlFor="height">Bạn cao bao nhiêu?</label>
                    <div className="input-shell">
                      <input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="Ví dụ: 170"
                      />
                      <span className="unit">cm</span>
                    </div>
                  </div>
                  <div className="input-col">
                    <label className="field-label" htmlFor="weight">Cân nặng của bạn</label>
                    <div className="input-shell">
                      <input
                        id="weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Ví dụ: 60"
                      />
                      <span className="unit">kg</span>
                    </div>
                  </div>
                </div>

                <button type="button" className="submit-btn" onClick={calculateBMI}>Tính ngay</button>
              </form>
            </div>

            <div className="bmi-card info-panel">
              <div className="info-hero">
                <div className="hero-icon">🧮</div>
                <div>
                  <div className="hero-title">Đo chỉ số BMI</div>
                  <div className="hero-text">Kết quả đo chỉ số BMI giúp bạn biết mình đang thừa cân, béo phì hay suy dinh dưỡng để kịp thời điều chỉnh lối sống.</div>
                </div>
              </div>

              <div className="info-section">
                <div className="info-row info-title">
                  <span role="img" aria-label="alert">⚠️</span>
                  <span>Miễn trừ trách nhiệm</span>
                </div>
                <div className="info-copy">Kết quả đo chỉ số BMI giúp bạn biết mình đang thừa cân, béo phì hay suy dinh dưỡng để kịp thời điều chỉnh lối sống.</div>
              </div>

              <div className="info-section">
                <div className="info-row info-title">
                  <span role="img" aria-label="info">ℹ️</span>
                  <span>Thông tin</span>
                </div>
                <ul className="info-list">
                  {infoItems.map((item, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                      <li key={item.title} className="info-item">
                        <button
                          type="button"
                          className="info-toggle"
                          onClick={() => setOpenIndex(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                        >
                          <span className={`info-title-text ${isOpen ? 'open' : ''}`}>{item.title}</span>
                          <span className="plus">{isOpen ? '−' : '+'}</span>
                        </button>
                        <div className={`info-content ${isOpen ? 'open' : ''}`}>{item.content}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {showResult && (
          <div className="result-layout">
            <div className="result-nav-column">
              <div className="bmi-header slim">
                <h1>Đo chỉ số BMI</h1>
                <div className="bmi-expert">
                  <img src="https://cdn-icons-png.flaticon.com/512/2922/2922656.png" alt="Chuyên gia" />
                  <div>
                    <div className="expert-line">Tham vấn y khoa: Chuyên gia dinh dưỡng Phạm Thị Diệp</div>
                    <div className="expert-date">30/09/2023</div>
                  </div>
                </div>
              </div>

              <div className="result-nav-list">
                <div className="result-link active">Kết quả BMI của bạn!</div>
                <div className="result-link muted">Thống kê</div>
              </div>
            </div>

            <div className="result-right">
              <button type="button" className="reset-btn" onClick={handleReset} aria-label="Kiểm tra lại">
                ↺
              </button>

              <div className="result-card hero full">
                <div className="hero-header">
                  <div>
                    <div className="hero-subtitle">Chỉ số BMI của bạn là</div>
                    <div className="hero-bmi">
                      {bmi}
                      <span
                        className="hero-badge"
                        style={{
                          background: classifyBmi(bmi)?.color || '#475569',
                          color: '#0b1220',
                          boxShadow: `0 10px 22px ${classifyBmi(bmi)?.color || '#94a3b8'}44`,
                        }}
                      >
                        {classifyBmi(bmi)?.label}
                      </span>
                    </div>
                    <div className="hero-text">
                      Chỉ số BMI của bạn được coi là {classifyBmi(bmi)?.label}. Kiểm tra cân nặng thường xuyên để điều chỉnh chế độ ăn và hoạt động.
                    </div>
                  </div>
                  <div className="hero-figure" aria-hidden>🧍</div>
                </div>
                <div className="hero-scale">
                  <div className="scale-bar">
                    <div className="scale-section under" />
                    <div className="scale-section normal" />
                    <div className="scale-section over" />
                    <div className="scale-section obese1" />
                    <div className="scale-section obese2" />
                  </div>
                  <div
                    className="scale-dot"
                    style={{
                      left: `${Math.min(100, Math.max(0, (parseFloat(bmi) - 15) * 4))}%`,
                      background: classifyBmi(bmi)?.color || '#22d3ee',
                      boxShadow: `0 0 0 8px ${(classifyBmi(bmi)?.color || '#22d3ee')}33`,
                    }}
                  />
                </div>
              </div>

              <div className="result-card chart-card">
                <div className="chart-head">
                  <div>
                    <p className="label">Biểu đồ BMI</p>
                    <h4>Theo dõi ngày / tuần / tháng</h4>
                  </div>
                  <div className="chart-range">
                    {['day', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        className={`range-chip ${chartRange === range ? 'active' : ''}`}
                        onClick={() => setChartRange(range)}
                      >
                        {range === 'day' && 'Ngày'}
                        {range === 'week' && 'Tuần'}
                        {range === 'month' && 'Tháng'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bmi-area">
                  <svg viewBox="0 0 500 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="bmiGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {chartPoints.length > 0 && (
                      <>
                        <path
                          className="bmi-area-path"
                          d={`M0,220 ${chartPoints
                            .map((p, idx) => {
                              const x = (idx / Math.max(chartPoints.length - 1, 1)) * 500;
                              const y = p.bmi ? 220 - (p.bmi / (p.max || 35)) * 200 : 220;
                              return `L${x},${y}`;
                            })
                            .join(' ')} L500,220 Z`}
                          fill="url(#bmiGradient)"
                          stroke="rgba(34,211,238,0.8)"
                          strokeWidth="2"
                        />
                        {chartPoints.map((p, idx) => {
                          const x = (idx / Math.max(chartPoints.length - 1, 1)) * 500;
                          const y = p.bmi ? 220 - (p.bmi / (p.max || 35)) * 200 : 220;
                          const color = classifyBmi(p.bmi)?.color || '#22d3ee';
                          const showLabel = chartPoints.length <= 14 || idx % 2 === 0;
                          return (
                            <g key={p.date}>
                              <circle cx={x} cy={y} r={6} fill={color} opacity={p.bmi ? 0.9 : 0} />
                              {p.bmi ? (
                                <text x={x} y={y - 10} textAnchor="middle" className="bmi-area-value">
                                  {p.bmi}
                                </text>
                              ) : null}
                              {showLabel ? (
                                <text x={x} y={210} textAnchor="middle" className="bmi-area-label">
                                  {p.label}
                                </text>
                              ) : null}
                            </g>
                          );
                        })}
                      </>
                    )}
                  </svg>
                </div>
              </div>

              <div className="result-card recommendation wide">
                <div className="rec-icon">💡</div>
                <div>
                  <div className="rec-title">Bạn được khuyến nghị tìm một kế hoạch ăn kiêng cụ thể</div>
                  <div className="rec-text">
                    Rất khuyến khích bạn tham khảo ý kiến chuyên gia y tế để được tư vấn y tế cá nhân hóa liên quan đến tình trạng sức khỏe của bạn.
                  </div>
                </div>
                <button className="rec-btn" onClick={() => navigate('/bmr')}>Kiểm tra kế hoạch quản lý cân nặng</button>
              </div>

              <div ref={chartRef} className="chart-cards">
                <div className="info-card">
                  <div className="info-card-title">
                    <span className="info-icon">ℹ️</span>
                    <span>Tình trạng</span>
                  </div>
                  <div className="info-card-text">
                    Bạn được coi là béo phì cấp độ 2 nếu có chỉ số BMI trên 30.
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-card-title warn">
                    <span className="info-icon warn">⚠️</span>
                    <span>Nguy cơ</span>
                  </div>
                  <div className="info-card-text">
                    Béo phì có thể làm tăng nguy cơ tiến triển bệnh tiểu đường tuýp 2, tăng huyết áp, bệnh tim mạch, đột quỵ, viêm xương khớp, bệnh gan nhiễm mỡ, bệnh thận và một số bệnh ung thư.
                  </div>
                </div>
              </div>

              <div className="disclaimer bottom">
                ⚠️ Công cụ này mang tính tham khảo thông tin, không thay thế cho tư vấn chuyên môn. Liên hệ bác sĩ nếu có thắc mắc.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTracker;
