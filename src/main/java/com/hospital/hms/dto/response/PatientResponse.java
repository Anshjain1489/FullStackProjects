package com.hospital.hms.dto.response;

import com.hospital.hms.enums.BloodGroup;
import com.hospital.hms.enums.Gender;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PatientResponse {
    private Long id;
    private String patientId;
    private String firstName;
    private String lastName;
    private String fullName;
    private LocalDate dateOfBirth;
    private int age;
    private Gender gender;
    private String phone;
    private String email;
    private String address;
    private BloodGroup bloodGroup;
    private String emergencyContact;
    private String emergencyContactName;
    private LocalDateTime createdAt;
}
