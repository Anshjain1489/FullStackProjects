package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.PaymentVerifyRequest;
import com.hospital.hms.dto.response.PaymentOrderResponse;
import com.hospital.hms.entity.Billing;
import com.hospital.hms.enums.PaymentStatus;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.BillingRepository;
import com.hospital.hms.service.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final BillingRepository billingRepository;

    @Value("${app.razorpay.key-id}")
    private String keyId;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            this.razorpayClient = new RazorpayClient(keyId, keySecret);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Razorpay Client", e);
        }
    }

    @Override
    @Transactional
    public PaymentOrderResponse createPaymentOrder(Long billingId) {
        Billing billing = billingRepository.findById(billingId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billingId));

        if (billing.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("This invoice has already been paid.");
        }

        try {
            // Razorpay expects amount in paise (1 INR = 100 paise)
            BigDecimal amountInINR = billing.getTotalAmount();
            int amountInPaise = amountInINR.multiply(new BigDecimal(100)).intValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", billing.getInvoiceNumber());

            Order order = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = order.get("id");

            return PaymentOrderResponse.builder()
                    .billingId(billingId)
                    .razorpayOrderId(razorpayOrderId)
                    .amount(amountInINR)
                    .amountInPaise(amountInPaise)
                    .currency("INR")
                    .keyId(keyId)
                    .patientName(billing.getPatient().getFirstName() + " " + billing.getPatient().getLastName())
                    .patientEmail(billing.getPatient().getEmail())
                    .patientPhone(billing.getPatient().getPhone())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Error creating Razorpay order: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public boolean verifyPaymentSignature(PaymentVerifyRequest request) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            // Validate signature using Razorpay SDK Utility
            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            if (isValid) {
                Billing billing = billingRepository.findById(request.getBillingId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", request.getBillingId()));

                // Update invoice status to PAID
                billing.setPaymentStatus(PaymentStatus.PAID);
                billing.setPaymentDate(LocalDate.now());
                billing.setPaymentMethod("RAZORPAY (" + request.getRazorpayPaymentId() + ")");
                billingRepository.save(billing);
            }

            return isValid;
        } catch (Exception e) {
            return false;
        }
    }
}
