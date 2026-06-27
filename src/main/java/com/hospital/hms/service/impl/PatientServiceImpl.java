package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.PatientRequest;
import com.hospital.hms.dto.response.PatientResponse;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.exception.ConflictException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Override
    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        patientRepository.findByPhone(request.getPhone()).ifPresent(p -> {
            throw new ConflictException("A patient with phone " + request.getPhone() + " already exists");
        });

        Patient patient = Patient.builder()
                .patientId(generatePatientId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .bloodGroup(request.getBloodGroup())
                .emergencyContact(request.getEmergencyContact())
                .emergencyContactName(request.getEmergencyContactName())
                .build();

        return mapToResponse(patientRepository.save(patient));
    }

    @Override
    public PatientResponse getPatientById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public PatientResponse getPatientByPatientId(String patientId) {
        return mapToResponse(patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "patientId", patientId)));
    }

    @Override
    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient = findById(id);
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setPhone(request.getPhone());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setEmergencyContact(request.getEmergencyContact());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        return mapToResponse(patientRepository.save(patient));
    }

    @Override
    @Transactional
    public void deletePatient(Long id) {
        patientRepository.delete(findById(id));
    }

    @Override
    public List<PatientResponse> searchPatients(String keyword) {
        return patientRepository.searchPatients(keyword).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));
    }

    private String generatePatientId() {
        return String.format("PAT-%05d", patientRepository.count() + 1);
    }

    private PatientResponse mapToResponse(Patient p) {
        PatientResponse r = new PatientResponse();
        r.setId(p.getId());
        r.setPatientId(p.getPatientId());
        r.setFirstName(p.getFirstName());
        r.setLastName(p.getLastName());
        r.setFullName(p.getFirstName() + " " + p.getLastName());
        r.setDateOfBirth(p.getDateOfBirth());
        r.setAge(Period.between(p.getDateOfBirth(), LocalDate.now()).getYears());
        r.setGender(p.getGender());
        r.setPhone(p.getPhone());
        r.setEmail(p.getEmail());
        r.setAddress(p.getAddress());
        r.setBloodGroup(p.getBloodGroup());
        r.setEmergencyContact(p.getEmergencyContact());
        r.setEmergencyContactName(p.getEmergencyContactName());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
