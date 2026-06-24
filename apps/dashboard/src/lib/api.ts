const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const HEADERS = {
  'Content-Type': 'application/json',
  'x-company-id': 'TEST', 
};

// Helper fetch para ahorrar código
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: HEADERS,
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Error en petición: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // --- GETTERS ---
  getVehicles: () => fetchApi('/vehicles', { cache: 'no-store' }),
  getTires: () => fetchApi('/tires', { cache: 'no-store' }),
  getAssets: () => fetchApi('/assets', { cache: 'no-store' }),
  getBranches: () => fetchApi('/branches', { cache: 'no-store' }),
  getPurchases: () => fetchApi('/purchases', { cache: 'no-store' }), // asumiendo que crearemos la ruta GET para compras si la necesitamos
  
  // --- POSTERS ---
  createVehicle: (data: any) => fetchApi('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  createBranch: (data: any) => fetchApi('/branches', { method: 'POST', body: JSON.stringify(data) }),
  createPurchase: (data: any) => fetchApi('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  
  assignTire: (data: any) => fetchApi('/assignments/tire', { method: 'POST', body: JSON.stringify(data) }),
  assignAsset: (data: any) => fetchApi('/assignments/asset', { method: 'POST', body: JSON.stringify(data) }),

  sendRetread: (data: any) => fetchApi('/tires/retread/send', { method: 'POST', body: JSON.stringify(data) }),
  receiveRetread: (data: any) => fetchApi('/tires/retread/receive', { method: 'POST', body: JSON.stringify(data) }),
  disposeTires: (data: any) => fetchApi('/tires/dispose', { method: 'POST', body: JSON.stringify(data) }),
  getVehicleCheckpoints: (vehicleId: string) => fetchApi(`/checkpoints/vehicle/${vehicleId}`, { cache: 'no-store' }),

  // --- GENERIC METHODS FOR MOBILE APP ---
  get: (url: string) => fetchApi(url, { method: 'GET', cache: 'no-store' }),
  post: (url: string, data: any) => fetchApi(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: (url: string, data: any) => fetchApi(url, { method: 'PATCH', body: JSON.stringify(data) }),
};
