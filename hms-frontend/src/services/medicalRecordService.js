import api from './api';
const BASE = '/api/medical-records';
export const medicalRecordService = {
  getAll:    ()       => api.get(BASE),
  getById:   (id)     => api.get(`${BASE}/${id}`),
  getByPatient: (pid) => api.get(`${BASE}/patient/${pid}`),
  create:    (data)   => api.post(BASE, data),
  update:    (id, d)  => api.put(`${BASE}/${id}`, d),
  delete:    (id)     => api.delete(`${BASE}/${id}`),
};
