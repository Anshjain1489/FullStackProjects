import api from './api';
const BASE = '/api/rooms';
export const roomService = {
  getAll:    ()       => api.get(BASE),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  getAvailable: ()    => api.get(`${BASE}/available`),
  create:    (data)   => api.post(BASE, data),
  update:    (id, d)  => api.put(`${BASE}/${id}`, d),
  delete:    (id)     => api.delete(`${BASE}/${id}`),
};
