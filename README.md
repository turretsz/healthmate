# HealthMate – Trung tâm Quản lý Sức khỏe Cá nhân
- **Truy cập:** [Trạm Quản lý Sức khỏe HealthMate](https://turretsz.github.io/health-mate/)

**Mô tả:** Ứng dụng web giúp tính BMI/BMR, vùng nhịp tim, theo dõi nước/ngủ/vận động và lưu dữ liệu ngay trên trình duyệt. Không cần tài khoản hay backend.

## Công nghệ sử dụng
- React 19, React Router
- Bootstrap 5
- Lưu trữ cục bộ bằng `localStorage` (không server)

## Cấu trúc dự án
```
src
├─ components
│  ├─ HealthTracker.js        # BMI/BMR + lưu lịch sử
│  ├─ BMRCalculator.js        # Tính BMR (Mifflin-St Jeor)
│  ├─ HeartRateCalculator.js  # Vùng nhịp tim tập luyện
│  ├─ WellnessDashboard.js    # Nước, giấc ngủ, vận động
│  ├─ AuthModal.js / Profile.js (mock)
│  └─ styles/*.css
├─ context
│  ├─ AuthContext.js          # Lưu trạng thái đăng nhập giả lập
│  └─ ToastContext.js         # Thông báo ngắn
├─ App.js                     # Định tuyến và layout chính
└─ index.js                   # Bootstrap ứng dụng
```

## Các chức năng chính
1. **Kiểm tra & tính toán**
   - BMI, BMR, vùng nhịp tim (50–85%) theo Mifflin-St Jeor.
2. **Theo dõi sức khỏe**
   - Dashboard nước, ngủ, vận động; ghi chú nhanh; nhắc việc trong ngày.


     
