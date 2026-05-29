const API_URL = '/api';

export async function loadData() {
  try {
    const res = await fetch(`${API_URL}/data`);
    if (!res.ok) throw new Error('Failed to fetch data');
    return await res.json();
  } catch (e) {
    console.error('Failed to load data from API:', e);
    return null;
  }
}

export async function saveData(data) {
  try {
    const res = await fetch(`${API_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save data');
  } catch (e) {
    console.error('Failed to save data to API:', e);
  }
}

export async function loginUser(username, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) return { success: true, user: data.user };
    return { success: false, error: data.error };
  } catch (e) {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
}

export async function registerUser(fullname, username, password) {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, username, password }),
    });
    const data = await res.json();
    if (res.ok) return { success: true, message: data.message };
    return { success: false, error: data.error };
  } catch (e) {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
}
