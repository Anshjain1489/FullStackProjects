package com.hospital.hms.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MedicalRecordResponse {
    private Long id;
    private String recordId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long appointmentId;
    private LocalDate visitDate;
    private String diagnosis;
    private String prescription;
    private String labResults;
    private String notes;
    private LocalDateTime createdAt;
}
