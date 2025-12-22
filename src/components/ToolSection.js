// src/components/ToolSection.js
import React from 'react';
import { Link } from 'react-router-dom';
import './styles/ToolSection.css';

const categories = [
  {
    title: 'Theo dõi cân nặng',
    desc: 'Nhập cân nặng/chiều cao, nhận BMI và cảnh báo sớm theo chuẩn WHO.',
    link: '/health-tracker',
    tag: 'Kiểm tra nhanh',
  },
  {
    title: 'Kế hoạch năng lượng',
    desc: 'Tính BMR, TDEE và gợi ý lượng calo duy trì hoặc giảm cân.',
    link: '/bmr',
    tag: 'Quản lý ăn uống',
  },
  {
    title: 'Nhịp tim mục tiêu',
    desc: 'Tính vùng nhịp tim lý tưởng cho chạy bộ, đạp xe hoặc HIIT.',
    link: '/heart-rate',
    tag: 'Hiệu suất',
  },
];

const ToolSection = () => {
  return (
    <div className="tool-section">
      <div className="tool-section-grid">
        {categories.map((item) => (
          <div key={item.title} className="category-card">
            <div className="category-tag">{item.tag}</div>
            <div className="category-title">{item.title}</div>
            <p className="category-desc">{item.desc}</p>
            <Link to={item.link} className="category-cta">
              Dùng ngay <span>→</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="callout">
        <div>
          <div className="callout-title">Luồng nhắc nhở nền</div>
          <p className="callout-desc">
            Bật thông báo uống nước, giờ ngủ, giờ vận động và ghi chú dinh dưỡng ngay trên trang chính.
            Tất cả được ghim vào bảng điều khiển, không cần mở thêm tab.
          </p>
        </div>
        <button type="button" className="callout-btn">Bật nhắc nền</button>
      </div>
    </div>
  );
};

export default ToolSection;
