package com.hospital.hms.service;

import com.hospital.hms.dto.request.DoctorRequest;
import com.hospital.hms.dto.response.DoctorResponse;

import java.util.List;

public interface DoctorService {
    DoctorResponse createDoctor(DoctorRequest request);
    DoctorResponse getDoctorById(Long id);
    DoctorResponse getDoctorByDoctorId(String doctorId);
    List<DoctorResponse> getAllDoctors();
    List<DoctorResponse> getDoctorsByDepartment(Long departmentId);
    List<DoctorResponse> getAvailableDoctors();
    DoctorResponse updateDoctor(Long id, DoctorRequest request);
    void deleteDoctor(Long id);
    List<DoctorResponse> searchDoctors(String keyword);
}
