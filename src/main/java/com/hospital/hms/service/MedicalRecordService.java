package com.hospital.hms.service;

import com.hospital.hms.dto.request.MedicalRecordRequest;
import com.hospital.hms.dto.response.MedicalRecordResponse;

import java.util.List;

public interface MedicalRecordService {
    MedicalRecordResponse createRecord(MedicalRecordRequest request);
    MedicalRecordResponse getRecordById(Long id);
    MedicalRecordResponse getRecordByRecordId(String recordId);
    List<MedicalRecordResponse> getAllRecords();
    List<MedicalRecordResponse> getRecordsByPatient(Long patientId);
    List<MedicalRecordResponse> getRecordsByDoctor(Long doctorId);
    MedicalRecordResponse updateRecord(Long id, MedicalRecordRequest request);
    void deleteRecord(Long id);
}
