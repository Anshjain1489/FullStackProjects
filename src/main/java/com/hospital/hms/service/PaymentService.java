package com.hospital.hms.service;

import com.hospital.hms.dto.request.PaymentVerifyRequest;
import com.hospital.hms.dto.response.PaymentOrderResponse;

public interface PaymentService {
    PaymentOrderResponse createPaymentOrder(Long billingId);
    boolean verifyPaymentSignature(PaymentVerifyRequest request);
}
