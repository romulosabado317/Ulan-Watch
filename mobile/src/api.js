import axios from 'axios';

// IMPORTANT: change this to your computer's LAN IP while the backend runs on it,
// e.g. "http://192.168.1.10:4000". "localhost" will not work from a phone.
// Find your IP with `ipconfig` (Windows) or `ifconfig` / `ipconfig getifaddr en0` (Mac).
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = (configuredApiUrl || 'http://192.168.0.105:4000').replace(/\/+$/, '');

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000
});

export function setAuthToken(token) {
  if (token) client.defaults.headers.common.Authorization = 'Bearer ' + token;
  else delete client.defaults.headers.common.Authorization;
}

function messageFor(error) {
  return error?.response?.data?.error || 'Could not reach the server. Check that the backend is running and API_BASE_URL matches your computer\'s IP.';
}

export async function registerAccount({ name, email, password }) {
  try {
    const res = await client.post('/api/auth/register', { name, email, password });
    return res.data;
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function loginAccount({ email, password }) {
  try {
    const res = await client.post('/api/auth/login', { email, password });
    return res.data;
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function fetchCurrentUser() {
  try {
    const res = await client.get('/api/auth/me');
    return res.data.user;
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function fetchReports() {
  const res = await client.get('/api/reports');
  return res.data.reports;
}

export async function createReport(report) {
  try {
    const res = await client.post('/api/reports', report);
    return res.data.report;
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function updateReportStatus(id, status) {
  const res = await client.patch('/api/reports/' + id, { status });
  return res.data.report;
}

export async function checkHealth() {
  const res = await client.get('/api/health', { timeout: 4000 });
  return res.data;
}
