package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentRequest {

    @NotBlank(message = "Department name is required")
    private String name;

    private String description;
    private String location;
    private String phone;
    private Long headDoctorId;
    private boolean active = true;
}
