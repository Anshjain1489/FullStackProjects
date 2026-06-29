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
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
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
            log.info("Initializing Razorpay Client with Key ID: {}", keyId);
            this.razorpayClient = new RazorpayClient(keyId, keySecret);
        } catch (Exception e) {
            log.error("Failed to initialize Razorpay Client: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize Razorpay Client", e);
        }
    }

    @Override
    @Transactional
    public PaymentOrderResponse createPaymentOrder(Long billingId) {
        log.info("Initiating payment order creation for Billing ID: {}", billingId);
        
        Billing billing = billingRepository.findById(billingId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billingId));

        if (billing.getPaymentStatus() == PaymentStatus.PAID) {
            log.warn("Payment failed: Billing ID {} is already PAID", billingId);
            throw new IllegalArgumentException("This invoice has already been paid.");
        }

        // Defensive check: Ensure total amount is not null or zero
        BigDecimal amountInINR = billing.getTotalAmount();
        if (amountInINR == null || amountInINR.compareTo(BigDecimal.ZERO) <= 0) {
            log.error("Payment failed: Invoice amount is zero or null for Billing ID {}", billingId);
            throw new IllegalArgumentException("Invoice amount must be greater than 0 to pay.");
        }

        try {
            // Razorpay expects amount in paise (1 INR = 100 paise)
            int amountInPaise = amountInINR.multiply(new BigDecimal(100)).intValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", billing.getInvoiceNumber() != null ? billing.getInvoiceNumber() : "REC-" + billingId);

            log.info("Sending order creation request to Razorpay for amount: {} paise", amountInPaise);
            Order order = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = order.get("id");
            log.info("Razorpay Order created successfully. Order ID: {}", razorpayOrderId);

            String patientName = "Guest";
            String patientEmail = "";
            String patientPhone = "";

            if (billing.getPatient() != null) {
                patientName = billing.getPatient().getFirstName() + " " + billing.getPatient().getLastName();
                patientEmail = billing.getPatient().getEmail() != null ? billing.getPatient().getEmail() : "";
                patientPhone = billing.getPatient().getPhone() != null ? billing.getPatient().getPhone() : "";
            }

            return PaymentOrderResponse.builder()
                    .billingId(billingId)
                    .razorpayOrderId(razorpayOrderId)
                    .amount(amountInINR)
                    .amountInPaise(amountInPaise)
                    .currency("INR")
                    .keyId(keyId)
                    .patientName(patientName)
                    .patientEmail(patientEmail)
                    .patientPhone(patientPhone)
                    .build();

        } catch (Exception e) {
            log.error("Error occurred while creating Razorpay order for Billing ID {}: {}", billingId, e.getMessage(), e);
            throw new RuntimeException("Error creating Razorpay order: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public boolean verifyPaymentSignature(PaymentVerifyRequest request) {
        log.info("Verifying payment signature for Billing ID: {}", request.getBillingId());
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);
            log.info("Razorpay signature verification result: {}", isValid);

            if (isValid) {
                Billing billing = billingRepository.findById(request.getBillingId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", request.getBillingId()));

                billing.setPaymentStatus(PaymentStatus.PAID);
                billing.setPaymentDate(LocalDate.now());
                billing.setPaymentMethod("RAZORPAY (" + request.getRazorpayPaymentId() + ")");
                billingRepository.save(billing);
                log.info("Billing ID {} updated to PAID status", request.getBillingId());
            }

            return isValid;
        } catch (Exception e) {
            log.error("Error verifying payment signature for Billing ID {}: {}", request.getBillingId(), e.getMessage(), e);
            return false;
        }
    }
}
