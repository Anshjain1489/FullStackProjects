package com.hospital.hms.service;

import com.hospital.hms.dto.request.PatientRequest;
import com.hospital.hms.dto.response.PatientResponse;

import java.util.List;

public interface PatientService {
    PatientResponse createPatient(PatientRequest request);
    PatientResponse getPatientById(Long id);
    PatientResponse getPatientByPatientId(String patientId);
    List<PatientResponse> getAllPatients();
    PatientResponse updatePatient(Long id, PatientRequest request);
    void deletePatient(Long id);
    List<PatientResponse> searchPatients(String keyword);
}
