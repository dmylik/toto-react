import { useData } from '../../context/DataContext';

export default function AdminSettings() {
  const { data, updateSettings, refresh } = useData();
  const settings = data.app?.settings || {};

  const toggleSetting = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <div className="admin-settings">
      <h1 className="page-title">🔒 Настройки блокировок</h1>

      <div className="settings-list">
        <div className="setting-row">
          <div className="setting-info">
            <h3>Блокировка прогнозов</h3>
            <p>Запретить пользователям оставлять прогнозы на матчи</p>
          </div>
          <button
            className={`toggle-btn ${settings.lockPredictions ? 'active' : ''}`}
            onClick={() => toggleSetting('lockPredictions')}
          >
            {settings.lockPredictions ? '🔒 Заблокировано' : '🔓 Открыто'}
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h3>Блокировка выбора финалистов</h3>
            <p>Запретить пользователям выбирать финалистов групп</p>
          </div>
          <button
            className={`toggle-btn ${settings.lockFinalsSelection ? 'active' : ''}`}
            onClick={() => toggleSetting('lockFinalsSelection')}
          >
            {settings.lockFinalsSelection ? '🔒 Заблокировано' : '🔓 Открыто'}
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h3>Блокировка выбора победителя</h3>
            <p>Запретить пользователям выбирать победителя турнира</p>
          </div>
          <button
            className={`toggle-btn ${settings.lockWinnerSelection ? 'active' : ''}`}
            onClick={() => toggleSetting('lockWinnerSelection')}
          >
            {settings.lockWinnerSelection ? '🔒 Заблокировано' : '🔓 Открыто'}
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h3>Блокировка раздела Плей-офф</h3>
            <p>Скрыть матчи плей-офф от пользователей до наступления этой стадии</p>
          </div>
          <button
            className={`toggle-btn ${settings.lockPlayoffSection ? 'active' : ''}`}
            onClick={() => toggleSetting('lockPlayoffSection')}
          >
            {settings.lockPlayoffSection ? '🔒 Заблокировано' : '🔓 Открыто'}
          </button>
        </div>
      </div>
    </div>
  );
}
