package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.AppointmentRequest;
import com.hospital.hms.dto.response.AppointmentResponse;
import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.enums.AppointmentStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        if (!doctor.isAvailable()) {
            throw new BadRequestException("Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + " is currently not available");
        }

        // Check for time slot conflict
        boolean conflict = appointmentRepository
                .findByDoctorIdAndAppointmentDate(doctor.getId(), request.getAppointmentDate())
                .stream()
                .anyMatch(a -> a.getAppointmentTime().equals(request.getAppointmentTime()));

        if (conflict) {
            throw new BadRequestException("Dr. " + doctor.getLastName() + " already has an appointment at "
                    + request.getAppointmentTime() + " on " + request.getAppointmentDate());
        }

        Appointment appointment = Appointment.builder()
                .appointmentId(generateAppointmentId())
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .status(AppointmentStatus.SCHEDULED)
                .reason(request.getReason())
                .notes(request.getNotes())
                .build();

        return mapToResponse(appointmentRepository.save(appointment));
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public AppointmentResponse getAppointmentByAppointmentId(String appointmentId) {
        return mapToResponse(appointmentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "appointmentId", appointmentId)));
    }

    @Override
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDate(date).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        Appointment appt = findById(id);
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setAppointmentDate(request.getAppointmentDate());
        appt.setAppointmentTime(request.getAppointmentTime());
        appt.setReason(request.getReason());
        appt.setNotes(request.getNotes());
        return mapToResponse(appointmentRepository.save(appt));
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long id, AppointmentStatus status) {
        Appointment appt = findById(id);
        appt.setStatus(status);
        return mapToResponse(appointmentRepository.save(appt));
    }

    @Override
    @Transactional
    public void cancelAppointment(Long id) {
        Appointment appt = findById(id);
        appt.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Appointment findById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
    }

    private String generateAppointmentId() {
        return String.format("APT-%07d", appointmentRepository.count() + 1);
    }

    private AppointmentResponse mapToResponse(Appointment a) {
        AppointmentResponse r = new AppointmentResponse();
        r.setId(a.getId());
        r.setAppointmentId(a.getAppointmentId());
        r.setPatientId(a.getPatient().getId());
        r.setPatientName(a.getPatient().getFirstName() + " " + a.getPatient().getLastName());
        r.setDoctorId(a.getDoctor().getId());
        r.setDoctorName("Dr. " + a.getDoctor().getFirstName() + " " + a.getDoctor().getLastName());
        r.setSpecialization(a.getDoctor().getSpecialization());
        r.setAppointmentDate(a.getAppointmentDate());
        r.setAppointmentTime(a.getAppointmentTime());
        r.setStatus(a.getStatus());
        r.setReason(a.getReason());
        r.setNotes(a.getNotes());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }
}
