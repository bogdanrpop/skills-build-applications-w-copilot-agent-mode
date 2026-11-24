import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required', 400);
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw httpError('A valid userId is required', 400);
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw httpError('A valid teamId is required', 400);
  }
  if (typeof type !== 'string' || !type.trim()) throw httpError('Activity type is required', 400);
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw httpError('Minutes must be a positive whole number', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw httpError('User not found', 404);
  if (!team) throw httpError('Team not found', 404);

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required', 400);
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw httpError('Team name is required', 400);
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError('Team mascot is required', 400);
  if (!Array.isArray(members)) throw httpError('Team members must be an array of user IDs', 400);
  const memberIds: string[] = [];
  for (const member of members) {
    if (typeof member !== 'string' || !Types.ObjectId.isValid(member)) {
      throw httpError('Team members must be valid user IDs', 400);
    }
    memberIds.push(member);
  }

  if (memberIds.length) {
    const found = await User.countDocuments({ _id: { $in: memberIds } });
    if (found !== new Set(memberIds).size) throw httpError('One or more team members were not found', 404);
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError('User not found', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentActivity = activities[0]?.type.trim().toLowerCase();
  const goalAvailable = workouts.some((workout) => workout.focus.toLowerCase() === goal);
  const activityAvailable = recentActivity
    ? workouts.some((workout) => workout.focus.toLowerCase() === recentActivity)
    : false;
  const focus = goalAvailable ? goal : activityAvailable ? recentActivity : undefined;
  if (!focus) return [];
  const ordered = [
    ...workouts.filter((workout) => workout.focus.toLowerCase() === focus),
    ...workouts.filter((workout) => workout.focus.toLowerCase() !== focus),
  ];

  return ordered.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === goal
      ? `Recommended based on your fitness goal: ${user.fitnessGoal}.`
      : workout.focus.toLowerCase() === recentActivity
        ? `Recommended based on your recent ${activities[0]?.type} activity.`
        : 'Suggested workout.',
  }));
}

export { User };
