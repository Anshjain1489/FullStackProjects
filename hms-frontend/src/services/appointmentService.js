import api from './api';
const BASE = '/api/appointments';
export const appointmentService = {
  getAll:    ()       => api.get(BASE),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  create:    (data)   => api.post(BASE, data),
  update:    (id, d)  => api.put(`${BASE}/${id}`, d),
  updateStatus: (id, status) => api.patch(`${BASE}/${id}/status?status=${status}`),
  delete:    (id)     => api.delete(`${BASE}/${id}`),
};
