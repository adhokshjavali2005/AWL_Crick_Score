import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3001';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  return { 'Content-Type': 'application/json' };
}

// ── Match APIs ──

export async function fetchMatches() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/matches`, { headers });
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function fetchMatch(matchId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/matches/${matchId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch match');
  return res.json();
}

export async function createMatchAPI(state: unknown) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/matches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ state }),
  });
  if (!res.ok) throw new Error('Failed to create match');
  return res.json();
}

export async function updateMatchAPI(matchId: string, state: unknown) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/matches/${matchId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ state }),
  });
  if (!res.ok) throw new Error('Failed to update match');
  return res.json();
}

export async function deleteMatchAPI(matchId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/matches/${matchId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete match');
  return res.json();
}

// ── Team APIs ──

export async function fetchTeamNames(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/teams`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function fetchTeamPlayers(teamName: string) {
  const res = await fetch(`${API_URL}/api/teams/${encodeURIComponent(teamName)}/players`);
  if (!res.ok) throw new Error('Failed to fetch team players');
  return res.json();
}

export async function saveTeamPlayersAPI(teamName: string, players: unknown[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/teams/${encodeURIComponent(teamName)}/players`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ players }),
  });
  if (!res.ok) throw new Error('Failed to save team players');
  return res.json();
}

// ── Profile APIs ──

export async function upsertProfile(name: string, email: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error('Failed to save profile');
  return res.json();
}

export async function searchProfileByEmail(email: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile/search?email=${encodeURIComponent(email)}`, {
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}
