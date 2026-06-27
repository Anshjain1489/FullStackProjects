package com.hospital.hms.dto.request;

import com.hospital.hms.enums.RoomStatus;
import com.hospital.hms.enums.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Room type is required")
    private RoomType roomType;

    @NotNull(message = "Room status is required")
    private RoomStatus status;

    private Integer floor;

    @DecimalMin(value = "0.0", message = "Price per day cannot be negative")
    private BigDecimal pricePerDay;
}
