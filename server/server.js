const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const DEFAULT_WATER_GOAL = 2000;

app.use(cors());
app.use(express.json());

const defaultTools = [
  {
    icon: '/data/BMI_new.png.webp',
    title: 'Đo chỉ số BMI',
    description: 'Nhập cân nặng/chiều cao, nhận BMI và cảnh báo sớm theo chuẩn WHO.',
    link: '/health-tracker',
    badge: 'Cân nặng',
  },
  {
    icon: '/data/BMR_new.png.webp',
    title: 'Tính chỉ số BMR & TDEE',
    description: 'Mifflin-St Jeor • Kèm gợi ý mức calo mỗi ngày cho mục tiêu.',
    link: '/bmr',
    badge: 'Năng lượng',
  },
  {
    icon: '/data/Target-Heart-Rate.png.webp',
    title: 'Nhịp tim lý tưởng',
    description: 'Tính nhịp tim mục tiêu theo độ tuổi và cường độ vận động.',
    link: '/heart-rate',
    badge: 'Tim mạch',
  },
];

const seedUsers = [
  { name: 'Lan', email: 'lan@example.com', password: 'Health@123', gender: 'female', birthDate: '1995-01-01', plan: 'Free', role: 'user' },
  { name: 'Minh', email: 'minh@example.com', password: 'Health@123', gender: 'male', birthDate: '1992-02-02', plan: 'Pro', role: 'user' },
  { name: 'Admin', email: 'admin@healthmate.dev', password: 'Admin@123', gender: 'male', birthDate: '1990-01-01', plan: 'Pro', role: 'admin' },
];

const tokens = new Map(); // token -> userId

const issueToken = (userId) => {
  const token = Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString('base64');
  tokens.set(token, userId);
  return token;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = tokens.get(token);
  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ message: 'Người dùng không tồn tại.' });
  }
  req.user = user;
  req.token = token;
  return next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ quản trị viên mới được phép.' });
  }
  return next();
};

const ensureSeeded = async () => {
  await Promise.all(
    seedUsers.map((seed) =>
      prisma.user.upsert({
        where: { email: seed.email },
        update: {
          name: seed.name,
          password: seed.password,
          gender: seed.gender,
          birthDate: seed.birthDate,
          plan: seed.plan,
          role: seed.role,
        },
        create: seed,
      }),
    ),
  );
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'HealthMate backend is running' });
});

app.get('/api/tools', (_req, res) => {
  res.json({ tools: defaultTools });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, gender, birthDate, email, password } = req.body || {};
  if (!name || !email || !password || !birthDate) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) return res.status(400).json({ message: 'Email đã tồn tại.' });
  if (String(password).length < 8) return res.status(400).json({ message: 'Mật khẩu cần tối thiểu 8 ký tự.' });

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      gender,
      birthDate,
      email: normalizedEmail,
      password,
      plan: 'Free',
      role: 'user',
    },
  });
  const token = issueToken(user.id);
  res.json({ user: sanitizeUser(user), token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || user.password !== password) return res.status(401).json({ message: 'Sai email hoặc mật khẩu.' });
  const token = issueToken(user.id);
  res.json({ user: sanitizeUser(user), token });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const payload = { user: sanitizeUser(req.user) };
  if (req.user.role === 'admin') {
    const allUsers = await prisma.user.findMany();
    payload.users = allUsers.map(sanitizeUser);
  }
  res.json(payload);
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  const updates = req.body || {};
  if (updates.email) {
    const normalizedEmail = String(updates.email).trim().toLowerCase();
    const exists = await prisma.user.findFirst({
      where: { email: normalizedEmail, NOT: { id: req.user.id } },
    });
    if (exists) return res.status(400).json({ message: 'Email đã được sử dụng.' });
    updates.email = normalizedEmail;
  }
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
  });
  res.json({ user: sanitizeUser(updated) });
});

app.put('/api/security/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Thiếu mật khẩu.' });
  }
  if (req.user.password !== currentPassword) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'Mật khẩu mới quá yếu.' });
  }
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: newPassword },
  });
  res.json({ message: 'Đã đổi mật khẩu.' });
});

app.post('/api/metrics/bmi', authMiddleware, async (req, res) => {
  const { height, weight, gender, age } = req.body || {};
  if (!height || !weight) {
    return res.status(400).json({ message: 'Thiếu chiều cao hoặc cân nặng.' });
  }
  const bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(1));
  await prisma.bmiLog.create({
    data: {
      userId: req.user.id,
      bmi,
      height,
      weight,
      gender,
      age,
    },
  });
  const logs = await prisma.bmiLog.findMany({
    where: { userId: req.user.id },
    orderBy: { recordedAt: 'desc' },
    take: 90,
  });
  res.json({ latest: logs[0], logs });
});

app.get('/api/metrics/bmi', authMiddleware, async (req, res) => {
  const logs = await prisma.bmiLog.findMany({
    where: { userId: req.user.id },
    orderBy: { recordedAt: 'desc' },
    take: 90,
  });
  res.json({ logs });
});

app.get('/api/water/summary', authMiddleware, async (req, res) => {
  const logs = await prisma.waterLog.findMany({
    where: { userId: req.user.id },
    orderBy: { recordedAt: 'desc' },
    take: 200,
  });
  const goalRecord = await prisma.waterGoal.findUnique({ where: { userId: req.user.id } });
  const goal = goalRecord?.goal || DEFAULT_WATER_GOAL;
  const withinDays = (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return logs.filter((l) => new Date(l.date) >= cutoff);
  };
  const sum = (items) => items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  res.json({
    goal,
    logs: logs.map((l) => ({ amount: l.amount, time: l.time, date: l.date })),
    totals: {
      day: sum(withinDays(1)),
      week: sum(withinDays(7)),
      month: sum(withinDays(30)),
    },
  });
});

app.post('/api/water/logs', authMiddleware, async (req, res) => {
  const { amount } = req.body || {};
  if (!amount) return res.status(400).json({ message: 'Thiếu lượng nước.' });
  const entry = await prisma.waterLog.create({
    data: {
      userId: req.user.id,
      amount: Number(amount),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().slice(0, 10),
    },
  });
  const logs = await prisma.waterLog.findMany({
    where: { userId: req.user.id },
    orderBy: { recordedAt: 'desc' },
    take: 200,
  });
  res.json({ entry, logs: logs.map((l) => ({ amount: l.amount, time: l.time, date: l.date })) });
});

app.put('/api/water/goal', authMiddleware, async (req, res) => {
  const { goal } = req.body || {};
  const normalized = Number(goal) || DEFAULT_WATER_GOAL;
  const record = await prisma.waterGoal.upsert({
    where: { userId: req.user.id },
    update: { goal: normalized },
    create: { userId: req.user.id, goal: normalized },
  });
  res.json({ goal: record.goal });
});

app.get('/api/admin/users', authMiddleware, adminOnly, async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json({ users: users.map(sanitizeUser) });
});

app.put('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const userId = Number(req.params.id);
  const updates = req.body || {};
  if (updates.email) {
    const normalizedEmail = String(updates.email).trim().toLowerCase();
    const exists = await prisma.user.findFirst({
      where: { email: normalizedEmail, NOT: { id: userId } },
    });
    if (exists) return res.status(400).json({ message: 'Email đã tồn tại.' });
    updates.email = normalizedEmail;
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });
  res.json({ user: sanitizeUser(updated) });
});

app.delete('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const userId = Number(req.params.id);
  await prisma.bmiLog.deleteMany({ where: { userId } });
  await prisma.waterLog.deleteMany({ where: { userId } });
  await prisma.waterGoal.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  res.json({ message: 'Đã xóa tài khoản.' });
});

const start = async () => {
  await ensureSeeded();
  app.listen(PORT, () => {
    console.log(`HealthMate backend listening on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Không thể khởi động server:', err);
  process.exit(1);
});
