import { useData } from '../../context/DataContext';
import { SCORING_LABELS } from '../../utils/scoring';

export default function AdminSettings() {
  const { data, updateSettings, updateScoring } = useData();
  const settings = data.app?.settings || {};
  const scoring = data.app?.scoring || {};

  const toggleSetting = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleScoringChange = (key, value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      updateScoring({ [key]: num });
    }
  };

  const scoringFields = [
    { key: 'matchOutcome', label: SCORING_LABELS.matchOutcome },
    { key: 'goalDifference', label: SCORING_LABELS.goalDifference },
    { key: 'teamGoals', label: SCORING_LABELS.teamGoals },
    { key: 'offByOne', label: SCORING_LABELS.offByOne },
    { key: 'exactScore', label: SCORING_LABELS.exactScore },
  ];

  const specialScoringFields = [
    { key: 'groupFinalist', label: SCORING_LABELS.groupFinalist },
    { key: 'champion', label: SCORING_LABELS.champion },
    { key: 'secondPlace', label: SCORING_LABELS.secondPlace },
    { key: 'thirdPlace', label: SCORING_LABELS.thirdPlace },
    { key: 'allThree', label: SCORING_LABELS.topThreePick },
  ];

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

      <hr className="section-divider" />

      <h1 className="page-title">🎯 Настройки начисления очков</h1>
      <p className="page-subtitle">Измените значения очков за каждый тип прогноза</p>

      <div className="settings-list">
        <h3 style={{ margin: '0.5rem 0', color: '#fbbf24' }}>За прогнозы на матчи</h3>
        {scoringFields.map(field => (
          <div key={field.key} className="setting-row">
            <div className="setting-info">
              <h3>{field.label}</h3>
            </div>
            <div className="scoring-input-group">
              <input
                type="number"
                min="0"
                max="100"
                className="scoring-input"
                value={scoring[field.key] ?? ''}
                onChange={e => handleScoringChange(field.key, e.target.value)}
              />
              <span className="scoring-unit">очк.</span>
            </div>
          </div>
        ))}

        <h3 style={{ margin: '1rem 0 0.5rem', color: '#fbbf24' }}>За финалистов и победителей</h3>
        {specialScoringFields.map(field => (
          <div key={field.key} className="setting-row">
            <div className="setting-info">
              <h3>{field.label}</h3>
            </div>
            <div className="scoring-input-group">
              <input
                type="number"
                min="0"
                max="100"
                className="scoring-input"
                value={scoring[field.key] ?? ''}
                onChange={e => handleScoringChange(field.key, e.target.value)}
              />
              <span className="scoring-unit">очк.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
