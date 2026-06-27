package com.hospital.hms.controller;

import com.hospital.hms.dto.request.BillingRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.BillingResponse;
import com.hospital.hms.enums.PaymentStatus;
import com.hospital.hms.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Billing and payment management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class BillingController {

    private final BillingService billingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Create a new bill/invoice")
    public ResponseEntity<ApiResponse<BillingResponse>> createBill(
            @Valid @RequestBody BillingRequest request) {
        BillingResponse response = billingService.createBill(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bill by database ID")
    public ResponseEntity<ApiResponse<BillingResponse>> getBillById(@PathVariable Long id) {
        BillingResponse response = billingService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success("Bill fetched successfully", response));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    @Operation(summary = "Get bill by invoice number (e.g. INV-001)")
    public ResponseEntity<ApiResponse<BillingResponse>> getBillByInvoiceNumber(
            @PathVariable String invoiceNumber) {
        BillingResponse response = billingService.getBillByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(ApiResponse.success("Bill fetched successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all bills")
    public ResponseEntity<ApiResponse<List<BillingResponse>>> getAllBills() {
        List<BillingResponse> response = billingService.getAllBills();
        return ResponseEntity.ok(ApiResponse.success("Bills fetched successfully", response));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get bills by patient ID")
    public ResponseEntity<ApiResponse<List<BillingResponse>>> getBillsByPatient(
            @PathVariable Long patientId) {
        List<BillingResponse> response = billingService.getBillsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.success("Patient bills fetched successfully", response));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get bills by payment status")
    public ResponseEntity<ApiResponse<List<BillingResponse>>> getBillsByPaymentStatus(
            @PathVariable PaymentStatus status) {
        List<BillingResponse> response = billingService.getBillsByPaymentStatus(status);
        return ResponseEntity.ok(ApiResponse.success("Bills by status fetched successfully", response));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get total revenue from paid bills")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevenue() {
        BigDecimal revenue = billingService.getTotalRevenue();
        return ResponseEntity.ok(ApiResponse.success("Total revenue fetched successfully", revenue));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Update bill by ID")
    public ResponseEntity<ApiResponse<BillingResponse>> updateBill(
            @PathVariable Long id,
            @Valid @RequestBody BillingRequest request) {
        BillingResponse response = billingService.updateBill(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bill updated successfully", response));
    }

    @PatchMapping("/{id}/payment-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Update bill payment status")
    public ResponseEntity<ApiResponse<BillingResponse>> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam PaymentStatus status) {
        BillingResponse response = billingService.updatePaymentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Payment status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete bill by ID")
    public ResponseEntity<ApiResponse<Void>> deleteBill(@PathVariable Long id) {
        billingService.deleteBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill deleted successfully"));
    }
}
