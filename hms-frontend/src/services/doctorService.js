import api from './api';
const BASE = '/api/doctors';
export const doctorService = {
  getAll:    ()       => api.get(BASE),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  create:    (data)   => api.post(BASE, data),
  update:    (id, d)  => api.put(`${BASE}/${id}`, d),
  delete:    (id)     => api.delete(`${BASE}/${id}`),
};
