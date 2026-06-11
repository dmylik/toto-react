import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import GroupFinals from '../components/GroupFinals';

export default function FinalsPage() {
  const { data, saveFinals, getUserFinals } = useData();
  const { user } = useAuth();
  const existingFinals = getUserFinals(user?.id);
  const isLocked = data.app?.settings?.lockFinalsSelection;

  const [savedGroup, setSavedGroup] = useState(null);

  if (isLocked) {
    return (
      <div className="page-message">
        <h2>🔒 Выбор финалистов заблокирован</h2>
        <p>Администратор временно отключил возможность выбора финалистов.</p>
      </div>
    );
  }

  const handleSaveGroup = (groupKey, selected) => {
    const allFinals = { ...existingFinals, [groupKey]: selected };
    saveFinals(user.id, allFinals);
    setSavedGroup(groupKey);
    setTimeout(() => setSavedGroup(null), 2000);
  };

  return (
    <div className="finals-page">
      <h1 className="page-title">🎯 Выбор финалистов групп</h1>
      <p className="page-subtitle">Выберите по 2 команды из каждой группы, которые пройдут в плей-офф</p>

      {savedGroup && <p className="toast-success">Группа {savedGroup} ✓</p>}

      <div className="finals-grid">
        {Object.keys(data.groups).map(key => (
          <GroupFinals
            key={key}
            groupKey={key}
            group={data.groups[key]}
            existingFinals={existingFinals}
            onSave={handleSaveGroup}
          />
        ))}
      </div>
    </div>
  );
}
