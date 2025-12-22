// src/components/HealthTools.js
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import './styles/HealthTools.css';

const HealthTools = ({ featureFlags = {} }) => {
  const { notify } = useToast();
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Use PUBLIC_URL so images work both locally and on GitHub Pages subpath
  const assetBase = process.env.PUBLIC_URL || '';
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    let isMounted = true;

    const fetchTools = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/tools`);
        if (!isMounted) return;
        const apiTools = res.data?.tools?.map((t) => ({
          ...t,
          icon: `${assetBase}${t.icon}`,
        })) || [];
        setTools(apiTools);
      } catch (err) {
        if (!isMounted) return;
        setError('Không tải được danh sách công cụ, dùng dữ liệu mặc định.');
        // Fallback to static list
        setTools([
          {
            icon: `${assetBase}/data/BMI_new.png.webp`,
            title: 'Đo chỉ số BMI',
            description: 'Đo BMI tức thời, phân loại theo khuyến nghị WHO và gợi ý bước tiếp theo.',
            link: '/health-tracker',
            badge: 'Cân nặng',
          },
          {
            icon: `${assetBase}/data/BMR_new.png.webp`,
            title: 'Tính chỉ số BMR & TDEE',
            description: 'Tự động tính Mifflin-St Jeor, đề xuất mức calo hằng ngày cho mục tiêu của bạn.',
            link: '/bmr',
            badge: 'Năng lượng',
          },
          {
            icon: `${assetBase}/data/Target-Heart-Rate.png.webp`,
            title: 'Nhịp tim lý tưởng',
            description: 'Tính nhịp tim mục tiêu theo độ tuổi và cường độ, kèm vùng luyện tập.',
            link: '/heart-rate',
            badge: 'Tim mạch',
          },
        ]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTools();
    return () => {
      isMounted = false;
    };
  }, [apiBase, assetBase]);

  const lockedPaths = useMemo(
    () => ({
      '/bmr': !featureFlags.bmr,
      '/heart-rate': !featureFlags.heart,
      '/dashboard': !featureFlags.dashboard,
    }),
    [featureFlags],
  );
  const handleToolClick = (tool) => (e) => {
    if (lockedPaths[tool.link]) {
      e.preventDefault();
      notify('Chức năng đang trong quá trình phát triển, vui lòng quay lại sau.', { type: 'info' });
    }
  };

  return (
    <div className="tools-grid">
      {error && <div className="tool-error">{error}</div>}
      {isLoading && <div className="tool-loading">Đang tải công cụ...</div>}
      {tools.map((tool) => {
        const isLocked = lockedPaths[tool.link];
        return (
          <Link
            key={tool.title}
            to={tool.link}
            className={`tool-card ${isLocked ? 'tool-locked' : ''}`}
            onClick={handleToolClick(tool)}
            aria-disabled={isLocked}
          >
            <div className="tool-top">
              <div className="tool-icon">
                <img src={tool.icon} alt={tool.title} className="tool-icon-img" />
              </div>
            <span className="tool-badge">{tool.badge}</span>
            </div>
            <div className="tool-title">{tool.title}</div>
            <p className="tool-description">{tool.description}</p>
            <div className="tool-footer">
            <span className="tool-cta">{isLocked ? 'Đang phát triển' : 'Mở công cụ'}</span>
            <span className="tool-arrow">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default HealthTools;
