package com.hospital.hms.service;

import com.hospital.hms.dto.request.BillingRequest;
import com.hospital.hms.dto.response.BillingResponse;
import com.hospital.hms.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.List;

public interface BillingService {
    BillingResponse createBill(BillingRequest request);
    BillingResponse getBillById(Long id);
    BillingResponse getBillByInvoiceNumber(String invoiceNumber);
    List<BillingResponse> getAllBills();
    List<BillingResponse> getBillsByPatient(Long patientId);
    List<BillingResponse> getBillsByPaymentStatus(PaymentStatus status);
    BillingResponse updateBill(Long id, BillingRequest request);
    BillingResponse updatePaymentStatus(Long id, PaymentStatus status);
    void deleteBill(Long id);
    BigDecimal getTotalRevenue();
}
