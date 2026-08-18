// VaultCare AI - API Service Layer to connect React Frontend with PostgreSQL Express Backend
const API_BASE_URL = 'http://localhost:5000/api';

// Health Check
export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'OK';
  } catch (e) {
    return false;
  }
};

// Fetch User Profile from PostgreSQL
export const fetchUserProfile = async (email) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('PostgreSQL Backend offline, using local state.');
    return null;
  }
};

// Update User Profile in PostgreSQL
export const updateUserProfile = async (email, profileData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('PostgreSQL Backend offline, updating local state.');
    return null;
  }
};

// Fetch Patient Reports from PostgreSQL
export const fetchUserReports = async (userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

// Save New Report to PostgreSQL
export const saveReportToPostgres = async (reportData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};
