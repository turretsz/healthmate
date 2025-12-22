# Hướng dẫn chạy backend nội bộ

Tài liệu này mô tả nhanh cách khởi chạy backend Express cục bộ và cách kết nối giao diện HealthMate để đáp ứng các user story US01‑US08.

## 1) Cài đặt phụ thuộc
```bash
# Đảm bảo đang ở thư mục dự án
npm install
```

## 2) Chuẩn bị MySQL + Prisma
**2.1 Cài và tạo database**
- Cài MySQL (bản community). Đăng nhập MySQL CLI hoặc dùng GUI.
- Tạo DB rỗng:
  ```sql
  CREATE DATABASE healthmate DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'healthuser'@'%' IDENTIFIED BY 'healthpass';
  GRANT ALL PRIVILEGES ON healthmate.* TO 'healthuser'@'%';
  FLUSH PRIVILEGES ;
  ```
  (Bạn có thể đổi tên DB/user/pass tùy ý.)

**2.2 Khai báo biến môi trường**
- Tạo file `.env` từ mẫu:
  ```bash
  cp .env.example .env
  ```
- Sửa `DATABASE_URL` theo thông tin của bạn, ví dụ:
  ```
  DATABASE_URL="mysql://healthuser:healthpass@localhost:3306/healthmate"
  ```

**2.3 Sinh Prisma Client và chạy migration tạo bảng**
- Chạy một lần để sinh client và tạo bảng theo schema (users, bmi_logs, water_logs, water_goal):
  ```bash
  npx prisma generate
  npx prisma migrate dev --name init
  ```
- Sau khi migrate xong, Prisma sẽ tạo bảng:
  - `User`: quản lý tài khoản. Cột chính: `id` (PK, auto inc), `name`, `email` (unique), `password` (plaintext mẫu, nên thay bằng hash khi đưa vào prod), `gender` (optional), `birthDate` (optional), `plan` (`Free`/`Pro`), `role` (`user`/`admin`).
  - `BmiLog`: log BMI theo user. Cột: `id` (PK), `userId` (FK → User), `bmi` (float), `height` (cm), `weight` (kg), `gender`, `age`, `recordedAt` (timestamp).
  - `WaterLog`: log nước theo user. Cột: `id` (PK), `userId` (FK → User), `amount` (ml mỗi lần ghi), `time` (HH:MM), `date` (YYYY-MM-DD), `recordedAt`.
  - `WaterGoal`: mục tiêu nước/ngày. Cột: `userId` (PK, FK → User), `goal` (ml/ngày, mặc định 2000).

**2.4 Kiểm tra bảng**
- Dùng Prisma Studio để xem nhanh dữ liệu: `npx prisma studio`.
- Hoặc MySQL CLI: `USE healthmate; SHOW TABLES; DESCRIBE User;`.
- Nếu cần seed lại dữ liệu mẫu, xoá dữ liệu và chạy `npm run start:server` (server tự upsert seed).

**2.5 Liên hệ user story**
- US05: `BmiLog` cung cấp dữ liệu biểu đồ ngày/tuần/tháng.
- US06: `WaterGoal` + `WaterLog` lưu mục tiêu và log nước.
- US07/US08: `User` phục vụ quản trị sửa/xoá; FK cascade sẽ xoá kèm log nước/BMI khi xoá user.

Bạn có thể kiểm tra nhanh bằng:
  ```bash
  npx prisma studio
  ```

## 3) Khởi chạy backend
```bash
# Chạy API ở http://localhost:5000
npm run start:server
```

- Backend dùng MySQL qua Prisma và tự seed khi khởi động:
  - User: `lan@example.com` / `Health@123`
  - Admin: `admin@healthmate.dev` / `Admin@123`
- API chính:
  - `POST /api/auth/register` – Đăng ký tài khoản (US01)
  - `POST /api/auth/login` – Đăng nhập và lấy token (US02)
  - `PUT /api/profile` – Cập nhật thông tin cá nhân (US04)
  - `PUT /api/security/password` – Đổi mật khẩu
  - `POST /api/metrics/bmi`, `GET /api/metrics/bmi` – Lưu & đọc log BMI (US03, US05)
  - `PUT /api/water/goal`, `POST /api/water/logs`, `GET /api/water/summary` – Mục tiêu & nhật ký nước (US06)
  - `GET/PUT/DELETE /api/admin/users/:id` – Quản trị sửa/xóa tài khoản (US07, US08)
  - `GET /api/tools` – Danh sách thẻ công cụ trên trang chủ

## 3) Chạy frontend kết nối API
```bash
# (tuỳ chọn) cấu hình URL API nếu khác localhost
export REACT_APP_API_URL=http://localhost:5000
npm start
```

## 4) Kiểm tra nhanh theo user story
- US01: Mở modal đăng ký, tạo tài khoản mới → thấy thông báo thành công, token được lưu.
- US02: Đăng nhập → quay về trang chủ, snapshot hiển thị dữ liệu BMI/BMR nếu có.
- US03: Trong BMI tool, nhập số đo và tính → dữ liệu được gửi vào `/api/metrics/bmi`.
- US04: Trang `Hồ sơ` cập nhật tên/email/giới tính/ngày sinh và lưu qua API.
- US05: Sau khi đo BMI, biểu đồ ngày/tuần/tháng hiển thị lịch sử (lấy từ API hoặc local fallback).
- US06: Trên Dashboard, đặt “Mục tiêu nước/ngày” và thêm log nước → progress bar tăng, dữ liệu lưu server.
- US07: Đăng nhập bằng admin, mở Dashboard → nút “Sửa” cho từng user để đổi tên/email/gói/role.
- US08: Trong bảng quản trị, nhấn “Xóa” để xoá tài khoản người dùng (kèm xác nhận).

## 5) Ghi chú
- Backend dùng MySQL + Prisma; dữ liệu bền vững qua migration. Có thể bật lại fallback localStorage trên frontend nếu chưa có DB.
- Nếu API không sẵn sàng, giao diện tự động fallback localStorage để bạn vẫn thử nghiệm được luồng.
