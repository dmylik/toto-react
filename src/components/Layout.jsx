import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

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
                Мои
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
          <span className="user-badge">{user?.fullname || user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">Выйти</button>
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Slide-out overlay */}
      <div className={`side-menu-overlay ${menuOpen ? 'open' : ''}`} onClick={closeMenu}></div>
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <span>{user?.fullname || user?.username}</span>
          <button className="hamburger-btn" onClick={closeMenu}>✕</button>
        </div>
        <NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
          🏆 Группы
        </NavLink>
        {user?.role === 'user' && (
          <>
            <NavLink to="/matches" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
              📊 Прогнозы
            </NavLink>
            <NavLink to="/my-predictions" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
              📋 Мои прогнозы
            </NavLink>
            <NavLink to="/finals" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
              🏅 Финалисты
            </NavLink>
            <NavLink to="/winner" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
              👑 Победитель
            </NavLink>
          </>
        )}
        <div className="side-menu-divider"></div>
        <NavLink to="/statistics" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
          📈 Статистика
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
            ⚙️ Админ
          </NavLink>
        )}
        <button onClick={() => { closeMenu(); handleLogout(); }} className="side-link side-logout">
          🚪 Выйти
        </button>
      </div>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
