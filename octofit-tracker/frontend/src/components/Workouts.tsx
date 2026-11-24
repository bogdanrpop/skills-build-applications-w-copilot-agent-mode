import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus: string; minutes: number; reason: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      emptyMessage="No workout suggestions yet."
      isEmpty={(data) => data.suggestions.length === 0}
      renderData={(data) => (
        <ul className="list-group">
          {data.suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={`${suggestion.title}-${index}`}>
              <strong>{suggestion.title}</strong> — {suggestion.focus}, {suggestion.minutes} minutes. {suggestion.reason}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
