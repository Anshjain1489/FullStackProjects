package com.hospital.hms.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DoctorResponse {
    private Long id;
    private String doctorId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String specialization;
    private String phone;
    private String email;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private Long departmentId;
    private String departmentName;
    private boolean available;
    private String bio;
    private LocalDateTime createdAt;
}
