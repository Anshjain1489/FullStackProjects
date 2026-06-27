package com.hospital.hms.dto.response;

import com.hospital.hms.enums.RoomStatus;
import com.hospital.hms.enums.RoomType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class RoomResponse {
    private Long id;
    private String roomNumber;
    private RoomType roomType;
    private RoomStatus status;
    private Integer floor;
    private BigDecimal pricePerDay;
    private Long currentPatientId;
    private String currentPatientName;
    private LocalDate admissionDate;
    private LocalDateTime createdAt;
}
