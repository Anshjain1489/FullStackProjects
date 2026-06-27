package com.hospital.hms.repository;

import com.hospital.hms.entity.Billing;
import com.hospital.hms.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingRepository extends JpaRepository<Billing, Long> {
    Optional<Billing> findByInvoiceNumber(String invoiceNumber);
    List<Billing> findByPatientId(Long patientId);
    List<Billing> findByPaymentStatus(PaymentStatus paymentStatus);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Billing b WHERE b.paymentStatus = 'PAID'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COUNT(b) FROM Billing b WHERE b.paymentStatus = 'PENDING'")
    long countPendingBills();
}
