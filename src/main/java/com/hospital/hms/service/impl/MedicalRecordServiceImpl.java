package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.MedicalRecordRequest;
import com.hospital.hms.dto.response.MedicalRecordResponse;
import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.MedicalRecordRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public MedicalRecordResponse createRecord(MedicalRecordRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));
        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", request.getAppointmentId()));
        }

        MedicalRecord record = MedicalRecord.builder()
                .recordId(generateRecordId())
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .visitDate(request.getVisitDate())
                .diagnosis(request.getDiagnosis())
                .prescription(request.getPrescription())
                .labResults(request.getLabResults())
                .notes(request.getNotes())
                .build();

        return mapToResponse(medicalRecordRepository.save(record));
    }

    @Override
    public MedicalRecordResponse getRecordById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public MedicalRecordResponse getRecordByRecordId(String recordId) {
        return mapToResponse(medicalRecordRepository.findByRecordId(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "recordId", recordId)));
    }

    @Override
    public List<MedicalRecordResponse> getAllRecords() {
        return medicalRecordRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<MedicalRecordResponse> getRecordsByPatient(Long patientId) {
        return medicalRecordRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<MedicalRecordResponse> getRecordsByDoctor(Long doctorId) {
        return medicalRecordRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MedicalRecordResponse updateRecord(Long id, MedicalRecordRequest request) {
        MedicalRecord record = findById(id);
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));
        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", request.getAppointmentId()));
        }
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setAppointment(appointment);
        record.setVisitDate(request.getVisitDate());
        record.setDiagnosis(request.getDiagnosis());
        record.setPrescription(request.getPrescription());
        record.setLabResults(request.getLabResults());
        record.setNotes(request.getNotes());
        return mapToResponse(medicalRecordRepository.save(record));
    }

    @Override
    @Transactional
    public void deleteRecord(Long id) {
        medicalRecordRepository.delete(findById(id));
    }

    private MedicalRecord findById(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", id));
    }

    private String generateRecordId() {
        return String.format("MR-%07d", medicalRecordRepository.count() + 1);
    }

    private MedicalRecordResponse mapToResponse(MedicalRecord m) {
        MedicalRecordResponse r = new MedicalRecordResponse();
        r.setId(m.getId());
        r.setRecordId(m.getRecordId());
        r.setPatientId(m.getPatient().getId());
        r.setPatientName(m.getPatient().getFirstName() + " " + m.getPatient().getLastName());
        r.setDoctorId(m.getDoctor().getId());
        r.setDoctorName("Dr. " + m.getDoctor().getFirstName() + " " + m.getDoctor().getLastName());
        if (m.getAppointment() != null) r.setAppointmentId(m.getAppointment().getId());
        r.setVisitDate(m.getVisitDate());
        r.setDiagnosis(m.getDiagnosis());
        r.setPrescription(m.getPrescription());
        r.setLabResults(m.getLabResults());
        r.setNotes(m.getNotes());
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }
}
