# HealthMate – Ứng dụng Theo dõi Sức khỏe

## 1) Giới thiệu
- Web app theo dõi sức khỏe (BMI, BMR/TDEE, nhịp tim, nước) với frontend React và backend Express + Prisma.
- Hỗ trợ đăng ký/đăng nhập, cập nhật hồ sơ, lưu chỉ số và xem lịch sử theo người dùng.

## 2) Công nghệ
- Frontend: React 19, React Router, CSS thuần.
- Backend: Node.js/Express.
- ORM: Prisma.
- Database: PostgreSQL (đã dùng Neon/Supabase, có thể thay DB Postgres khác).

## 3) Cấu trúc chính
```
src/
  components/        # UI: Header, AuthModal, HealthTracker, BMR, HeartRate, Dashboard, Profile...
  context/           # AuthContext, ToastContext
  App.js             # Định tuyến, layout
server/
  server.js          # API Express, seed user, routes auth/profile/metrics
prisma/
  schema.prisma      # Models User, BmiLog, WaterLog, WaterGoal
public/              # Tài nguyên tĩnh
```

## 4) Chuẩn bị môi trường
Tạo file `.env` (backend):
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
PORT=5000
```

Tạo `.env.local` (frontend):
```
REACT_APP_API_URL=http://localhost:5000
```

## 5) Cài đặt & chạy
```bash
npm install
npx prisma generate
npx prisma db push         # tạo bảng trên DB Postgres
npm run start:server       # backend trên PORT (mặc định 5000)
npm start                  # frontend dev tại 3000, gọi API qua REACT_APP_API_URL
```

Truy cập: http://localhost:3000  
Healthcheck API: http://localhost:5000/api/health

## 6) Tài khoản mẫu (seed)
- Admin: `admin@healthmate.dev` / `Admin@123`
- User:  `lan@example.com` / `Health@123`
- User:  `minh@example.com` / `Health@123`

## 7) Chức năng chính
- Đăng ký / Đăng nhập, lưu token, lấy thông tin user.
- Cập nhật hồ sơ cá nhân, đổi mật khẩu.
- Ghi log BMI, nước, mục tiêu nước.
- Dashboard: xem snapshot BMI/BMR/nhịp tim, nhật ký hành động.
- Quản lý người dùng (admin): xem danh sách, chỉnh sửa/xóa (qua API).

## 8) API tóm tắt
- `GET /api/health` – healthcheck.
- `POST /api/auth/register` – đăng ký.
- `POST /api/auth/login` – đăng nhập, trả token.
- `GET /api/auth/me` – lấy thông tin hiện tại (admin thấy danh sách user).
- `PUT /api/profile` – cập nhật hồ sơ.
- `PUT /api/security/password` – đổi mật khẩu.
- `POST /api/metrics/bmi` – ghi BMI.
- `POST /api/water/log` – ghi log nước.
- `POST /api/water/goal` – đặt mục tiêu nước.

Gửi token qua header: `Authorization: Bearer <token>`.

## 9) Script npm hữu ích
- `npm start` — frontend dev.
- `npm run start:server` — backend.
- `npm run build` — build frontend.
- `npm run db:generate` — prisma generate.
- `npm run db:migrate` — prisma migrate dev --name init (nếu dùng migration).

## 10) Triển khai (gợi ý)
- Backend (Render/Fly/...): set `DATABASE_URL`, `PORT`; build `npm install && npx prisma generate`; start `npm run start:server`.
- Frontend (Vercel/Netlify): set `REACT_APP_API_URL` trỏ backend; build `npm run build`.
- Không commit file `.env` / `.env.local`.
