# Deploy HealthMate (Neon Postgres + Render + Vercel)

Hướng dẫn chi tiết với Neon (Postgres free, ít vướng IPv4), backend Render, frontend Vercel.

## A. Chuẩn bị
1. Prisma dùng Postgres  
   - `prisma/schema.prisma`:  
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
2. Tạo DB Neon  
   - https://neon.tech → New Project → chọn region, name.  
   - Lấy connection string (Production/Password) dạng:  
     `postgresql://<user>:<password>@<host>/<dbname>`  
     Neon mặc định SSL, có thể thêm `?sslmode=require` nếu muốn.
3. `.env` backend (không commit)  
   ```
   DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
   ```
4. Đồng bộ schema & generate local  
   ```
   npx prisma db push
   npx prisma generate
   ```
5. Seed nhanh  
   - Chạy backend local `npm run start:server` để seed admin/user qua `ensureSeeded()`.
6. FE local env  
   - `.env.local` (không commit):  
     ```
     REACT_APP_API_URL=http://localhost:5000
     ```
7. Push code lên GitHub.

## B. Deploy backend (Render)
1. Render → New → Web Service → chọn repo/branch.  
2. Runtime: Node 18/20.  
3. Build command: `npm install && npx prisma generate`  
4. Start command: `npm run start:server`  
5. Env vars:  
   - `DATABASE_URL` = URI pooler Supabase.  
   - (tuỳ chọn) `PORT=5000` (Render sẽ dùng PORT của họ).  
6. Deploy, lấy URL, ví dụ `https://healthmate-api.onrender.com`.  
7. Test:  
   ```
   curl https://healthmate-api.onrender.com/api/health
   curl -X POST https://healthmate-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@healthmate.dev","password":"Admin@123"}'
   ```

## C. Deploy frontend (Vercel)
1. Vercel → New Project → import repo.  
2. Env:  
   ```
   REACT_APP_API_URL=https://healthmate-api.onrender.com
   ```
3. Build: `npm run build`  
4. Output: `build`  
5. Deploy → lấy domain `https://<proj>.vercel.app`.

## D. Kiểm tra end-to-end
- Mở domain Vercel, đăng nhập admin `admin@healthmate.dev / Admin@123`, thử BMI/Water log.  
- Kiểm tra bảng trên Supabase (User, BmiLog, WaterLog, WaterGoal).

## E. Lưu ý
- Không commit `.env` / `.env.local`; set env trên Render/Vercel.  
- Neon free: giới hạn storage/kết nối; dùng đúng connection string Production (SSL).  
- Nếu dùng migrate thay vì db push trên server: migrate local rồi chỉ `generate` trên Render.  
- Muốn MySQL: dùng PlanetScale (free), `provider="mysql"`, `DATABASE_URL` PlanetScale (kèm `sslaccept=strict`), nhưng FK không hỗ trợ.
