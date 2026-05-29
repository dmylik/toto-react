import { NavLink } from 'react-router-dom';

export default function AdminDashboard() {
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
      </div>
    </div>
  );
}
