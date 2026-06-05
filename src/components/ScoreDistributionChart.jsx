import { useMemo } from 'react';
import { getAllUsersScores } from '../utils/scoring';

/**
 * Распределение 100 очков между участниками пропорционально их превышению над минимумом.
 * Формула: P_i = (X_i - X_min) / sum(X - X_min) * 100
 */
export function calculateScoreDistribution(scores) {
  if (!scores || scores.length === 0) return [];

  const values = scores.map(s => s.score);
  const min = Math.min(...values);
  const diffs = values.map(v => v - min);
  const sumDiffs = diffs.reduce((a, b) => a + b, 0);

  if (sumDiffs === 0) {
    // All scores are equal
    return scores.map(s => ({
      ...s,
      distributionScore: 0,
      diff: 0,
      percentage: 0,
    }));
  }

  return scores.map((s, i) => ({
    ...s,
    diff: diffs[i],
    distributionScore: (diffs[i] / sumDiffs) * 100,
    percentage: (diffs[i] / sumDiffs) * 100,
  }));
}

export default function ScoreDistributionChart({ data }) {
  const scores = useMemo(() => getAllUsersScores(data), [data]);
  const distribution = useMemo(() => calculateScoreDistribution(scores), [scores]);

  if (distribution.length === 0) return null;

  const maxValue = Math.max(...distribution.map(d => d.distributionScore), 0.01);

  return (
    <div className="distribution-chart-wrapper">
      <h3 className="chart-title">📊 Распределение очков</h3>
      <p className="chart-subtitle">
        100 очков распределяются пропорционально превышению над последним местом
      </p>
      <div className="distribution-chart">
        {distribution.map((item) => {
          const heightPercent = maxValue > 0 ? (item.distributionScore / maxValue) * 100 : 0;
          return (
            <div key={item.userId} className="chart-bar-group">
              <div className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  title={`${item.fullname || item.username}: ${item.distributionScore.toFixed(2)} очка`}
                >
                  <span className="chart-bar-value">
                    {item.distributionScore.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="chart-bar-label" title={item.fullname || item.username}>
                {item.fullname || item.username}
              </div>
              <div className="chart-bar-score">{item.score} балл.</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
