export interface WellnessSession {
  id: string;
  type: "breathing" | "game";
  name: string;
  date: string;
  duration: number; // seconds
  score?: number;
  mood?: number; // 1-5
  details?: Record<string, any>;
}

const STORAGE_KEY = "mindbreath_sessions";

function getSessions(): WellnessSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: WellnessSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function addSession(session: Omit<WellnessSession, "id" | "date">): WellnessSession {
  const full: WellnessSession = {
    ...session,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const sessions = getSessions();
  sessions.push(full);
  saveSessions(sessions);
  return full;
}

export function getAllSessions(): WellnessSession[] {
  return getSessions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getSessionsByType(type: "breathing" | "game"): WellnessSession[] {
  return getAllSessions().filter((s) => s.type === type);
}

export function getRecentSessions(days = 7): WellnessSession[] {
  const cutoff = Date.now() - days * 86400000;
  return getAllSessions().filter((s) => new Date(s.date).getTime() >= cutoff);
}

export function getTotalMinutes(): number {
  return Math.round(getAllSessions().reduce((sum, s) => sum + s.duration, 0) / 60);
}

export function getAverageMood(): number {
  const withMood = getAllSessions().filter((s) => s.mood != null);
  if (!withMood.length) return 0;
  return withMood.reduce((sum, s) => sum + (s.mood || 0), 0) / withMood.length;
}
