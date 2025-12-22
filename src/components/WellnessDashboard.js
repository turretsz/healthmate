import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../services/apiClient';
import './styles/WellnessDashboard.css';

const BMI_STORAGE = 'hm_bmi_logs';
const WATER_STORAGE = 'hm_water_logs';
const DEFAULT_WATER_GOAL = 2000;

const readLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (_e) {
    return fallback;
  }
};

const classifyBmi = (value) => {
  if (!value) return { label: '---', color: '#94a3b8' };
  const bmiNum = parseFloat(value);
  if (bmiNum < 18.5) return { label: 'Thiếu cân', color: '#3b82f6' };
  if (bmiNum < 23) return { label: 'Khỏe mạnh', color: '#22c55e' };
  if (bmiNum < 25) return { label: 'Thừa cân', color: '#f59e0b' };
  if (bmiNum < 30) return { label: 'Béo phì độ 1', color: '#f97316' };
  if (bmiNum < 35) return { label: 'Béo phì độ 2', color: '#ef4444' };
  return { label: 'Béo phì độ 3', color: '#b91c1c' };
};

const WellnessDashboard = () => {
  const { user } = useAuth();
  const { notify } = useToast();
  const userKey = user?.id || 'guest';
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [height, setHeight] = useState(168);
  const [weight, setWeight] = useState(62);
  const [bmiLogs, setBmiLogs] = useState([]);
  const [bmiRange, setBmiRange] = useState('week'); // day | week | month
  const [waterGoal, setWaterGoal] = useState(DEFAULT_WATER_GOAL);
  const [waterLogs, setWaterLogs] = useState([]);
  const [waterInput, setWaterInput] = useState(300);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBmiLogs(readLocal(`${BMI_STORAGE}_${userKey}`, []));
    setWaterLogs(readLocal(`${WATER_STORAGE}_${userKey}`, []));
    const goalLocal = readLocal(`hm_water_goal_${userKey}`, DEFAULT_WATER_GOAL);
    setWaterGoal(goalLocal || DEFAULT_WATER_GOAL);
  }, [userKey]);

  useEffect(() => {
    const load = async () => {
      if (!userKey || userKey === 'guest') return;
      const bmiRes = await apiRequest('get', '/api/metrics/bmi');
      if (bmiRes.ok && Array.isArray(bmiRes.data?.logs)) {
        setBmiLogs(bmiRes.data.logs);
        if (bmiRes.data.logs.length) {
          setHeight(bmiRes.data.logs[0].height ?? 168);
          setWeight(bmiRes.data.logs[0].weight ?? 62);
        }
      }
      const waterRes = await apiRequest('get', '/api/water/summary');
      if (waterRes.ok && waterRes.data) {
        setWaterLogs(waterRes.data.logs || []);
        setWaterGoal(waterRes.data.goal || DEFAULT_WATER_GOAL);
      }
    };
    load();
  }, [userKey]);

  useEffect(() => {
    localStorage.setItem(`${BMI_STORAGE}_${userKey}`, JSON.stringify(bmiLogs));
    localStorage.setItem(`${WATER_STORAGE}_${userKey}`, JSON.stringify(waterLogs));
    localStorage.setItem(`hm_water_goal_${userKey}`, JSON.stringify(waterGoal));
  }, [bmiLogs, waterLogs, waterGoal, userKey]);

  const currentBmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) return null;
    return (w / Math.pow(h / 100, 2)).toFixed(1);
  }, [height, weight]);

  const bmiScale = useMemo(() => {
    const values = (Array.isArray(bmiLogs) ? bmiLogs : []).map((l) => l.bmi).filter(Boolean);
    const maxVal = Math.max(35, ...values, currentBmi ? Number(currentBmi) : 0);
    const minVal = 15;
    const range = Math.max(10, maxVal - minVal);
    return { min: minVal, max: maxVal, range };
  }, [bmiLogs, currentBmi]);

  const chartPoints = useMemo(() => {
    const history = Array.isArray(bmiLogs) ? bmiLogs : [];
    const days = bmiRange === 'day' ? 1 : bmiRange === 'month' ? 30 : 7;
    const points = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = history.find((log) => (log.date || log.recordedAt?.slice(0, 10)) === key);
      const bmiVal = found?.bmi ?? null;
      const clamped = bmiVal ? Math.max(bmiScale.min, Math.min(bmiScale.max, bmiVal)) : null;
      const y = clamped ? 220 - ((clamped - bmiScale.min) / bmiScale.range) * 200 : 220;
      points.push({
        date: key,
        label: key.slice(5).replace('-', '/'),
        bmi: bmiVal,
        y,
      });
    }
    return points;
  }, [bmiLogs, bmiRange, bmiScale]);

  const waterTotals = useMemo(() => {
    const logs = Array.isArray(waterLogs) ? waterLogs : [];
    const todayDate = new Date(`${today}T00:00:00`);
    const diffDays = (dStr) => {
      const d = new Date(`${dStr}T00:00:00`);
      return Math.floor((todayDate - d) / (1000 * 60 * 60 * 24));
    };
    const day = logs.filter((l) => (l.date || '') === today).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const week = logs
      .filter((l) => {
        const d = l.date || today;
        return diffDays(d) <= 6 && diffDays(d) >= 0;
      })
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const month = logs
      .filter((l) => {
        const d = l.date || today;
        return diffDays(d) <= 29 && diffDays(d) >= 0;
      })
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return { day, week, month };
  }, [waterLogs, today]);

  const waterProgress = useMemo(() => {
    const goal = Number(waterGoal) || DEFAULT_WATER_GOAL;
    if (!goal) return 0;
    return Math.min(100, Math.round((waterTotals.day / goal) * 100));
  }, [waterTotals.day, waterGoal]);

  const hydrationState = useMemo(() => {
    const pct = waterProgress;
    if (pct >= 100) return { label: 'Đã đạt mục tiêu nước', tone: 'good', note: `${pct}% mục tiêu` };
    if (pct >= 70) return { label: 'Gần đạt mục tiêu nước', tone: 'warn', note: `${pct}% mục tiêu, bổ sung thêm` };
    return { label: 'Thiếu nước hôm nay', tone: 'alert', note: `${pct}% mục tiêu, hãy uống thêm` };
  }, [waterProgress]);

  const bmiState = useMemo(() => {
    const bmi = currentBmi ? Number(currentBmi) : null;
    const info = classifyBmi(bmi);
    return {
      label: info.label || 'Chưa có dữ liệu',
      tone: bmi ? (bmi >= 18.5 && bmi < 23 ? 'good' : bmi < 25 ? 'warn' : 'alert') : 'muted',
      bmi,
    };
  }, [currentBmi]);

  const statusSummary = useMemo(() => {
    if (!currentBmi && !waterTotals.day) {
      return 'Chưa có dữ liệu. Thêm BMI hoặc log nước để xem trạng thái.';
    }
    if (hydrationState.tone === 'good' && bmiState.tone === 'good') {
      return 'Mọi thứ ổn: nước đủ và BMI trong vùng khỏe mạnh.';
    }
    if (hydrationState.tone === 'alert' || bmiState.tone === 'alert') {
      return 'Cần chú ý: uống thêm nước và kiểm tra lại BMI/TDEE.';
    }
    return 'Đang ổn, hãy hoàn thành mục tiêu nước và theo dõi BMI.';
  }, [hydrationState, bmiState, currentBmi, waterTotals.day]);

  const waterSeries = useMemo(() => {
    const logs = Array.isArray(waterLogs) ? waterLogs : [];
    const todayDate = new Date(`${today}T00:00:00`);
    const days = 7;
    const series = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = logs
        .filter((l) => (l.date || '') === key)
        .reduce((s, item) => s + (Number(item.amount) || 0), 0);
      series.push({
        date: key,
        label: key.slice(5).replace('-', '/'),
        total,
      });
    }
    return series;
  }, [waterLogs, today]);

  const saveBmiEntry = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) {
      notify('Nhập chiều cao và cân nặng để lưu BMI.', { type: 'warning' });
      return;
    }
    const bmiValue = Number((w / Math.pow(h / 100, 2)).toFixed(1));
    const entry = { bmi: bmiValue, height: h, weight: w, date: today };
    setSaving(true);
    try {
      const res = await apiRequest('post', '/api/metrics/bmi', entry);
      if (res.ok && Array.isArray(res.data?.logs)) {
        setBmiLogs(res.data.logs);
      } else {
        setBmiLogs((prev) => [entry, ...prev].slice(0, 90));
      }
      notify('Đã lưu BMI.', { type: 'success' });
    } catch (_e) {
      setBmiLogs((prev) => [entry, ...prev].slice(0, 90));
      notify('Lưu cục bộ (không kết nối server).', { type: 'warning' });
    } finally {
      setSaving(false);
    }
  };

  const addWater = async () => {
    const amt = Number(waterInput);
    if (!amt || amt <= 0) {
      notify('Nhập lượng nước hợp lệ (ml).', { type: 'warning' });
      return;
    }
    const now = new Date();
    const entry = {
      amount: amt,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toISOString().slice(0, 10),
    };
    setSaving(true);
    try {
      const res = await apiRequest('post', '/api/water/logs', { amount: amt });
      if (res.ok && Array.isArray(res.data?.logs)) {
        setWaterLogs(res.data.logs);
      } else {
        setWaterLogs((prev) => [entry, ...prev].slice(0, 200));
      }
    } catch (_e) {
      setWaterLogs((prev) => [entry, ...prev].slice(0, 200));
      notify('Lưu cục bộ (không kết nối server).', { type: 'warning' });
    } finally {
      setWaterInput(300);
      setSaving(false);
    }
  };

  const saveWaterGoal = async () => {
    const goalValue = Number(waterGoal) || DEFAULT_WATER_GOAL;
    setSaving(true);
    setWaterGoal(goalValue);
    try {
      const res = await apiRequest('put', '/api/water/goal', { goal: goalValue });
      if (res.ok) notify('Đã lưu mục tiêu nước/ngày.', { type: 'success' });
    } catch (_e) {
      notify('Không kết nối được server, đã lưu cục bộ.', { type: 'warning' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="journal-page">
      <div className="journal-head">
        <div>
          <p className="eyebrow">Nhật ký sức khỏe</p>
          <h1>BMI & Uống nước</h1>
          <p className="subhead">Hai trục chính: biểu đồ BMI theo thời gian và tiến độ nước uống trong ngày.</p>
        </div>
        <div className="today-chip">
          <span>Hôm nay</span>
          <strong>{today}</strong>
        </div>
      </div>

      <div className="journal-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="label">BMI</p>
              <h3>Biểu đồ & log</h3>
            </div>
            <div className="range-toggle">
              {['day', 'week', 'month'].map((r) => (
                <button key={r} className={bmiRange === r ? 'active' : ''} onClick={() => setBmiRange(r)}>
                  {r === 'day' ? 'Ngày' : r === 'week' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>

          <div className="bmi-row">
            <div className="bmi-hero">
              <p className="label">BMI hiện tại</p>
              <div className="bmi-value">
                {currentBmi || '--'}
                <span
                  className="hero-badge"
                  style={{
                    background: classifyBmi(currentBmi)?.color || '#94a3b8',
                    color: '#0b1220',
                  }}
                >
                  {classifyBmi(currentBmi)?.label}
                </span>
              </div>
              <div className="bmi-inputs">
                <label>
                  Cân nặng (kg)
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min={20} max={250} />
                </label>
                <label>
                  Chiều cao (cm)
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} min={100} max={250} />
                </label>
                <button onClick={saveBmiEntry} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu BMI'}</button>
              </div>
              <div className="bmi-mini">
                {bmiLogs.slice(0, 4).map((log, idx) => (
                  <div key={`${log.date || log.recordedAt}-${idx}`} className="mini-item">
                    <strong>{log.bmi}</strong>
                    <span>{(log.date || log.recordedAt || '').slice(0, 10)}</span>
                  </div>
                ))}
                {!bmiLogs.length && <p className="muted">Chưa có log BMI.</p>}
              </div>
            </div>

            <div className="bmi-area">
              <svg viewBox="0 0 500 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="bmiGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {chartPoints.length > 0 && (
                  <>
                    {[0.25, 0.5, 0.75, 1].map((t, idx) => {
                      const y = 240 - t * 200;
                      const value = (bmiScale.min + bmiScale.range * t).toFixed(0);
                      return (
                        <g key={`grid-${idx}`}>
                          <line x1="0" y1={y} x2="500" y2={y} className="bmi-grid-line" />
                          <text x="6" y={y - 2} className="bmi-grid-label">{value}</text>
                        </g>
                      );
                    })}
                    <path
                      className="bmi-area-path"
                      d={`M0,240 ${chartPoints
                        .map((p, idx) => {
                          const x = (idx / Math.max(chartPoints.length - 1, 1)) * 500;
                          const y = p.y;
                          return `L${x},${y}`;
                        })
                        .join(' ')} L500,240 Z`}
                      fill="url(#bmiGradient)"
                      stroke="rgba(34,211,238,0.8)"
                      strokeWidth="2"
                    />
                    {chartPoints.map((p, idx) => {
                      const x = (idx / Math.max(chartPoints.length - 1, 1)) * 500;
                      const y = p.y;
                      const color = classifyBmi(p.bmi)?.color || '#22d3ee';
                      const showLabel = chartPoints.length <= 14 ? true : idx % 2 === 0;
                      return (
                        <g key={p.date}>
                          <circle cx={x} cy={y} r={6} fill={color} opacity={p.bmi ? 0.9 : 0} />
                          {p.bmi ? (
                            <text x={x} y={y - 10} textAnchor="middle" className="bmi-area-value">
                              {p.bmi}
                            </text>
                          ) : null}
                          {showLabel ? (
                            <text x={x} y={224} textAnchor="middle" className="bmi-area-label">
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
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="label">Nước uống</p>
              <h3>Mục tiêu & tiến độ</h3>
            </div>
            <div className="goal-chip">
              <span>Mục tiêu</span>
              <strong>{waterGoal} ml/ngày</strong>
            </div>
          </div>

          <div className="water-grid">
            <div className="water-progress">
              <p className="muted">Hôm nay</p>
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${waterProgress}%` }} />
                </div>
                <div className="progress-meta">
                  <strong>{waterTotals.day} ml</strong>
                  <span>{waterProgress}% mục tiêu</span>
                </div>
              </div>
              <div className="water-stats">
                <div>
                  <p className="label">7 ngày</p>
                  <strong>{waterTotals.week} ml</strong>
                </div>
                <div>
                  <p className="label">30 ngày</p>
                  <strong>{waterTotals.month} ml</strong>
                </div>
              </div>
            </div>

            <div className="water-actions">
              <label>
                Mục tiêu (ml/ngày)
                <input
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(e.target.value)}
                  min={500}
                  step={100}
                />
              </label>
              <button onClick={saveWaterGoal} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu mục tiêu'}</button>
              <div className="divider" />
              <label>
                Ghi log nước (ml)
                <input
                  type="number"
                  value={waterInput}
                  onChange={(e) => setWaterInput(e.target.value)}
                  min={50}
                  step={50}
                />
              </label>
              <button onClick={addWater} disabled={saving}>{saving ? 'Đang ghi...' : 'Thêm log'}</button>
              <div className="water-log-list">
                {waterLogs.slice(0, 6).map((log, idx) => (
                  <div key={`${log.time}-${idx}`} className="mini-item">
                    <strong>{log.amount} ml</strong>
                    <span>{log.time} • {log.date}</span>
                  </div>
                ))}
                {!waterLogs.length && <p className="muted">Chưa có log nước.</p>}
              </div>
            </div>
          </div>

          <div className="water-chart">
            <div className="chart-head">
              <p className="label">7 ngày gần nhất</p>
              <span className="muted">Cột so với mục tiêu {waterGoal} ml/ngày</span>
            </div>
            <div className="water-bars">
              {waterSeries.map((item) => {
                const goal = Number(waterGoal) || DEFAULT_WATER_GOAL;
                const percent = Math.min(120, Math.round((item.total / goal) * 100));
                const goalLine = 98; // hiển thị gần đỉnh cột
                return (
                  <div key={item.date} className="bar-col">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${percent}%` }}
                        title={`${item.total} ml`}
                      />
                      <div className="goal-line" style={{ bottom: `${goalLine}%` }} />
                    </div>
                    <div className="bar-label">
                      <strong>{item.total} ml</strong>
                      <span>{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="status-card">
            <div className="status-head">
              <div>
                <p className="label">Trạng thái</p>
                <h4>{statusSummary}</h4>
              </div>
              <span className={`status-pill ${hydrationState.tone}`}>
                {hydrationState.label}
              </span>
            </div>
            <div className="status-grid">
              <div className={`status-box ${hydrationState.tone}`}>
                <p className="status-title">Nước hôm nay</p>
                <div className="status-value">{waterTotals.day || 0} ml</div>
                <p className="status-note">{hydrationState.note}</p>
                <div className="status-bar">
                  <span style={{ width: `${Math.min(100, waterProgress)}%` }} />
                </div>
              </div>
              <div className={`status-box ${bmiState.tone}`}>
                <p className="status-title">BMI</p>
                <div className="status-value">{bmiState.bmi ?? '--'}</div>
                <p className="status-note">{bmiState.label}</p>
                <div className="status-bar">
                  <span style={{ width: `${Math.min(100, ((bmiState.bmi || 22) / 35) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WellnessDashboard;
