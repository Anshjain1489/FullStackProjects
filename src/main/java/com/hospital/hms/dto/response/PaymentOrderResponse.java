package com.hospital.hms.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PaymentOrderResponse {
    private Long billingId;
    private String razorpayOrderId;
    private BigDecimal amount; // Original amount in INR
    private int amountInPaise; // Amount in paise (required by Razorpay frontend)
    private String currency;
    private String keyId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
}
