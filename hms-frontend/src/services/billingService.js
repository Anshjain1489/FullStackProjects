import api from './api';
const BASE = '/api/billing';
export const billingService = {
  getAll:    ()       => api.get(BASE),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  getByPatient: (pid) => api.get(`${BASE}/patient/${pid}`),
  create:    (data)   => api.post(BASE, data),
  update:    (id, d)  => api.put(`${BASE}/${id}`, d),
  updateStatus: (id, status) => api.patch(`${BASE}/${id}/payment-status?status=${status}`),
  delete:    (id)     => api.delete(`${BASE}/${id}`),
};
