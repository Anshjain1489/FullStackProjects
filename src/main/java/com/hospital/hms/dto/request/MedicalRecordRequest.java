package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MedicalRecordRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long appointmentId;

    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;

    private String diagnosis;
    private String prescription;
    private String labResults;
    private String notes;
}
