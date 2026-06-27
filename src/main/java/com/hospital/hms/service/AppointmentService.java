package com.hospital.hms.service;

import com.hospital.hms.dto.request.AppointmentRequest;
import com.hospital.hms.dto.response.AppointmentResponse;
import com.hospital.hms.enums.AppointmentStatus;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {
    AppointmentResponse createAppointment(AppointmentRequest request);
    AppointmentResponse getAppointmentById(Long id);
    AppointmentResponse getAppointmentByAppointmentId(String appointmentId);
    List<AppointmentResponse> getAllAppointments();
    List<AppointmentResponse> getAppointmentsByPatient(Long patientId);
    List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId);
    List<AppointmentResponse> getAppointmentsByDate(LocalDate date);
    AppointmentResponse updateAppointment(Long id, AppointmentRequest request);
    AppointmentResponse updateAppointmentStatus(Long id, AppointmentStatus status);
    void cancelAppointment(Long id);
}
