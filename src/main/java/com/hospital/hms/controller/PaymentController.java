package com.hospital.hms.controller;

import com.hospital.hms.dto.request.PaymentVerifyRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.PaymentOrderResponse;
import com.hospital.hms.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Razorpay payment integration endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/{id}/payment-order")
    @Operation(summary = "Create a Razorpay payment order for an invoice")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> createPaymentOrder(@PathVariable Long id) {
        PaymentOrderResponse response = paymentService.createPaymentOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Payment order generated successfully", response));
    }

    @PostMapping("/payment-verify")
    @Operation(summary = "Verify Razorpay payment signature and update invoice status")
    public ResponseEntity<ApiResponse<Boolean>> verifyPaymentSignature(
            @Valid @RequestBody PaymentVerifyRequest request) {
        boolean isVerified = paymentService.verifyPaymentSignature(request);
        if (isVerified) {
            return ResponseEntity.ok(ApiResponse.success("Payment verified and updated successfully", true));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Payment verification failed", false));
        }
    }
}
