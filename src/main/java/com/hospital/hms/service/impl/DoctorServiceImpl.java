package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.DoctorRequest;
import com.hospital.hms.dto.response.DoctorResponse;
import com.hospital.hms.entity.Department;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.exception.ConflictException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (request.getEmail() != null && doctorRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ConflictException("Doctor with email " + request.getEmail() + " already exists");
        }

        Department department = resolveDepartment(request.getDepartmentId());

        Doctor doctor = Doctor.builder()
                .doctorId(generateDoctorId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .specialization(request.getSpecialization())
                .phone(request.getPhone())
                .email(request.getEmail())
                .experienceYears(request.getExperienceYears())
                .consultationFee(request.getConsultationFee())
                .department(department)
                .bio(request.getBio())
                .available(true)
                .build();

        return mapToResponse(doctorRepository.save(doctor));
    }

    @Override
    public DoctorResponse getDoctorById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public DoctorResponse getDoctorByDoctorId(String doctorId) {
        return mapToResponse(doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "doctorId", doctorId)));
    }

    @Override
    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<DoctorResponse> getDoctorsByDepartment(Long departmentId) {
        return doctorRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<DoctorResponse> getAvailableDoctors() {
        return doctorRepository.findByAvailableTrue().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = findById(id);
        doctor.setFirstName(request.getFirstName());
        doctor.setLastName(request.getLastName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setPhone(request.getPhone());
        doctor.setEmail(request.getEmail());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setDepartment(resolveDepartment(request.getDepartmentId()));
        doctor.setBio(request.getBio());
        return mapToResponse(doctorRepository.save(doctor));
    }

    @Override
    @Transactional
    public void deleteDoctor(Long id) {
        doctorRepository.delete(findById(id));
    }

    @Override
    public List<DoctorResponse> searchDoctors(String keyword) {
        return doctorRepository.searchDoctors(keyword).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Doctor findById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
    }

    private Department resolveDepartment(Long departmentId) {
        if (departmentId == null) return null;
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));
    }

    private String generateDoctorId() {
        return String.format("DOC-%05d", doctorRepository.count() + 1);
    }

    private DoctorResponse mapToResponse(Doctor d) {
        DoctorResponse r = new DoctorResponse();
        r.setId(d.getId());
        r.setDoctorId(d.getDoctorId());
        r.setFirstName(d.getFirstName());
        r.setLastName(d.getLastName());
        r.setFullName("Dr. " + d.getFirstName() + " " + d.getLastName());
        r.setSpecialization(d.getSpecialization());
        r.setPhone(d.getPhone());
        r.setEmail(d.getEmail());
        r.setExperienceYears(d.getExperienceYears());
        r.setConsultationFee(d.getConsultationFee());
        r.setAvailable(d.isAvailable());
        r.setBio(d.getBio());
        r.setCreatedAt(d.getCreatedAt());
        if (d.getDepartment() != null) {
            r.setDepartmentId(d.getDepartment().getId());
            r.setDepartmentName(d.getDepartment().getName());
        }
        return r;
    }
}
