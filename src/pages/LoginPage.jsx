import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== password2) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }
        const result = await register(fullname, username, password);
        if (result.success) {
          setSuccess(result.message);
          setIsRegister(false);
          setFullname('');
          setUsername('');
          setPassword('');
          setPassword2('');
        } else {
          setError(result.error);
        }
      } else {
        const result = await login(username, password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      }
    } catch (e) {
      setError('Ошибка соединения с сервером');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🏆 TOTO Predictor</h1>
        <p className="login-subtitle">ЧМ-2026 по футболу</p>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {isRegister && (
            <div className="form-field">
              <label>Имя</label>
              <input type="text" value={fullname}
                onChange={e => setFullname(e.target.value)}
                placeholder="Введите ваше имя" required />
            </div>
          )}

          <div className="form-field">
            <label>Логин</label>
            <input type="text" value={username}
              onChange={e => { setUsername(e.target.value); setShowPassword(false); }}
              placeholder="Введите логин" required />
          </div>

          <div className="form-field">
            <label>Пароль</label>
            <div className="password-input-wrapper">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль" required />
              <button type="button" className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-field">
              <label>Повторите пароль</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? 'text' : 'password'} value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Повторите пароль" required />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <p className="login-toggle">
          {isRegister ? (
            <>Уже есть аккаунт? <button className="link-btn" onClick={() => setIsRegister(false)}>Войти</button></>
          ) : (
            <>Нет аккаунта? <button className="link-btn" onClick={() => setIsRegister(true)}>Зарегистрироваться</button></>
          )}
        </p>
      </div>
    </div>
  );
}
