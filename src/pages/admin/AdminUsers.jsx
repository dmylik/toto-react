import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { fetchAdminUsers } from '../../utils/storage';

export default function AdminUsers() {
  const { data, approveUser, rejectUser, deleteUser } = useData();
  const [showPasswords, setShowPasswords] = useState(false);
  const [userPasswords, setUserPasswords] = useState({});

  const pendingUsers = data.users.filter(u => u.role === 'user' && u.status === 'pending');
  const approvedUsers = data.users.filter(u => u.role === 'user' && u.status === 'approved');

  const handleTogglePasswords = async () => {
    if (!showPasswords) {
      // Fetch passwords from admin endpoint
      const result = await fetchAdminUsers();
      const pwMap = {};
      (result.users || []).forEach(u => {
        pwMap[u.id] = u.password;
      });
      setUserPasswords(pwMap);
    }
    setShowPasswords(!showPasswords);
  };

  const handleApprove = (userId) => {
    approveUser(userId);
  };

  const handleReject = (userId) => {
    if (window.confirm('Отклонить заявку пользователя?')) {
      rejectUser(userId);
    }
  };

  const handleDelete = (userId) => {
    if (window.confirm('Удалить пользователя? Все его прогнозы будут потеряны.')) {
      deleteUser(userId);
    }
  };

  return (
    <div className="admin-users">
      <h1 className="page-title">👥 Управление пользователями</h1>

      {pendingUsers.length > 0 && (
        <>
          <h2 className="page-subtitle" style={{ color: '#fbbf24' }}>
            ⏳ Ожидают подтверждения ({pendingUsers.length})
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td className="cell-id">{new Date(Number(u.id.split('_')[1]) || Date.now()).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-small btn-approve" onClick={() => handleApprove(u.id)}>✅ Подтвердить</button>
                    <button className="btn-danger-small" onClick={() => handleReject(u.id)}>❌ Отклонить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 className="page-subtitle" style={{ marginBottom: 0 }}>Участники ({approvedUsers.length})</h2>
        <button className="btn-small" onClick={handleTogglePasswords}>
          {showPasswords ? '🙈 Скрыть пароли' : '👁 Показать пароли'}
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Логин</th>
            {showPasswords && <th>Пароль</th>}
            <th>Прогнозов</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {approvedUsers.map(u => {
            const predictionCount = Object.keys(data.predictions[u.id] || {}).length;
            return (
              <tr key={u.id}>
                <td className="cell-id">{u.id.slice(0, 12)}...</td>
                <td>{u.fullname || u.username}</td>
                <td>{u.username}</td>
                {showPasswords && <td className="cell-id">{userPasswords[u.id] || '(нет)'}</td>}
                <td>{predictionCount}</td>
                <td>
                  <button className="btn-danger-small" onClick={() => handleDelete(u.id)}>Удалить</button>
                </td>
              </tr>
            );
          })}
          {approvedUsers.length === 0 && (
            <tr>
              <td colSpan={showPasswords ? 6 : 5} className="empty-cell">Нет подтверждённых пользователей</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
