import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  return (
    <CapabilityCard<TeamResponse>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      emptyMessage="No teams yet."
      isEmpty={(data) => data.teams.length === 0}
      renderData={(data) => (
        <ul className="list-group">
          {data.teams.map((team, index) => (
            <li className="list-group-item" key={`${team.name}-${index}`}>
              {team.name} — {team.mascot} ({team.members.length} members)
            </li>
          ))}
        </ul>
      )}
    />
  );
}
