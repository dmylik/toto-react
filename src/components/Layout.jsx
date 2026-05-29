import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <NavLink to="/">🏆 TOTO Predictor</NavLink>
        </div>
        <div className="navbar-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Группы
          </NavLink>
          {user?.role === 'user' && (
            <>
              <NavLink to="/matches" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Прогнозы
              </NavLink>
              <NavLink to="/my-predictions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Мои прогнозы
              </NavLink>
              <NavLink to="/finals" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Финалисты
              </NavLink>
              <NavLink to="/winner" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Победитель
              </NavLink>
            </>
          )}
          <NavLink to="/statistics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Статистика
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Админ
            </NavLink>
          )}
        </div>
        <div className="navbar-user">
          <span className="user-badge">{user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">Выйти</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
