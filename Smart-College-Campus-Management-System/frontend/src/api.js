const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function getApi(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export async function postApi(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Request failed: ${response.status}`);
  return result;
}
