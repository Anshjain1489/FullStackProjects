package com.hospital.hms.dto.response;

import com.hospital.hms.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BillingResponse {
    private Long id;
    private String invoiceNumber;
    private Long patientId;
    private String patientName;
    private Long appointmentId;
    private BigDecimal consultationFee;
    private BigDecimal roomCharges;
    private BigDecimal medicationCharges;
    private BigDecimal otherCharges;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String notes;
    private LocalDateTime createdAt;
}
