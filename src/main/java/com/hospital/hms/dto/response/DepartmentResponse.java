package com.hospital.hms.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private String location;
    private String phone;
    private Long headDoctorId;
    private String headDoctorName;
    private boolean active;
    private int totalDoctors;
    private LocalDateTime createdAt;
}
