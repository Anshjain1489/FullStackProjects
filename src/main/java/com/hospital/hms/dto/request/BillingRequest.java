package com.hospital.hms.dto.request;

import com.hospital.hms.enums.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BillingRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long appointmentId;

    @DecimalMin(value = "0.0", message = "Consultation fee cannot be negative")
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "Room charges cannot be negative")
    private BigDecimal roomCharges = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "Medication charges cannot be negative")
    private BigDecimal medicationCharges = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "Other charges cannot be negative")
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @NotNull(message = "Payment status is required")
    private PaymentStatus paymentStatus;

    private LocalDate paymentDate;
    private String paymentMethod;
    private String notes;
}
