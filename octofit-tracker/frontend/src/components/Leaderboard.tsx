import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      emptyMessage="No leaderboard scores yet."
      isEmpty={(data) => data.leaderboard.length === 0}
      renderData={(data) => (
        <ol className="list-group list-group-numbered">
          {data.leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.rank}>
              {entry.teamName} — {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    />
  );
}
