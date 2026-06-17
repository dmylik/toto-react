import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function AdminDashboard() {
  const [deployStatus, setDeployStatus] = useState(null);
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async () => {
    if (deploying) return;
    if (!window.confirm('Запустить деплой?\n\nБудут выполнены:\n• git pull origin main\n• npm install\n• npm run build\n• pm2 reload toto-predictor')) return;

    setDeploying(true);
    setDeployStatus('started');
    try {
      const res = await fetch('/api/admin/deploy', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDeployStatus('success');
      } else {
        setDeployStatus('error');
      }
    } catch {
      setDeployStatus('error');
    }
    setTimeout(() => {
      setDeploying(false);
      setDeployStatus(null);
    }, 5000);
  };

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">⚙️ Панель администратора</h1>
      <div className="admin-grid">
        <NavLink to="/admin/matches" className="admin-card">
          <div className="admin-card-icon">⚽</div>
          <h3>Управление матчами</h3>
          <p>Ввод результатов матчей</p>
        </NavLink>
        <NavLink to="/admin/users" className="admin-card">
          <div className="admin-card-icon">👥</div>
          <h3>Пользователи</h3>
          <p>Управление участниками</p>
        </NavLink>
        <NavLink to="/admin/settings" className="admin-card">
          <div className="admin-card-icon">🔒</div>
          <h3>Настройки блокировок</h3>
          <p>Включение/отключение функций</p>
        </NavLink>
        <NavLink to="/admin/predictions" className="admin-card">
          <div className="admin-card-icon">📊</div>
          <h3>Прогнозы</h3>
          <p>Просмотр и редактирование прогнозов пользователей</p>
        </NavLink>

        <button
          className="admin-card deploy-card"
          onClick={handleDeploy}
          disabled={deploying}
          style={{ cursor: deploying ? 'not-allowed' : 'pointer', opacity: deploying ? 0.6 : 1 }}
        >
          <div className="admin-card-icon">
            {deployStatus === 'success' ? '✅' : deploying ? '⏳' : '🚀'}
          </div>
          <h3>
            {deployStatus === 'success'
              ? 'Деплой запущен!'
              : deploying
                ? 'Развёртывание...'
                : 'Деплой'}
          </h3>
          <p>
            {deployStatus === 'success'
              ? 'git pull → npm install → build → pm2 reload'
              : deploying
                ? 'Выполняется...'
                : 'Обновить приложение из git'}
          </p>
        </button>
      </div>
    </div>
  );
}
