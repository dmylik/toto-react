import { useData } from '../context/DataContext';
import GroupTable from '../components/GroupTable';

export default function HomePage() {
  const { data } = useData();
  const groupKeys = Object.keys(data.groups);

  return (
    <div className="home-page">
      <h1 className="page-title">🏆 Чемпионат мира по футболу 2026</h1>
      <p className="page-subtitle">Турнирные таблицы групп</p>
      <div className="groups-grid">
        {groupKeys.map(key => (
          <GroupTable key={key} groupKey={key} />
        ))}
      </div>
    </div>
  );
}
