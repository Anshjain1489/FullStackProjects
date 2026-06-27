package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.BillingRequest;
import com.hospital.hms.dto.response.BillingResponse;
import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.Billing;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.enums.PaymentStatus;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.BillingRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public BillingResponse createBill(BillingRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", request.getAppointmentId()));
        }

        BigDecimal cf  = nvl(request.getConsultationFee());
        BigDecimal rc  = nvl(request.getRoomCharges());
        BigDecimal mc  = nvl(request.getMedicationCharges());
        BigDecimal oc  = nvl(request.getOtherCharges());
        BigDecimal tot = cf.add(rc).add(mc).add(oc);

        Billing billing = Billing.builder()
                .invoiceNumber(generateInvoiceNumber())
                .patient(patient)
                .appointment(appointment)
                .consultationFee(cf)
                .roomCharges(rc)
                .medicationCharges(mc)
                .otherCharges(oc)
                .totalAmount(tot)
                .paymentStatus(request.getPaymentStatus())
                .paymentDate(request.getPaymentDate())
                .paymentMethod(request.getPaymentMethod())
                .notes(request.getNotes())
                .build();

        return mapToResponse(billingRepository.save(billing));
    }

    @Override
    public BillingResponse getBillById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public BillingResponse getBillByInvoiceNumber(String invoiceNumber) {
        return mapToResponse(billingRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "invoiceNumber", invoiceNumber)));
    }

    @Override
    public List<BillingResponse> getAllBills() {
        return billingRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<BillingResponse> getBillsByPatient(Long patientId) {
        return billingRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<BillingResponse> getBillsByPaymentStatus(PaymentStatus status) {
        return billingRepository.findByPaymentStatus(status).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BillingResponse updateBill(Long id, BillingRequest request) {
        Billing billing = findById(id);
        BigDecimal cf  = nvl(request.getConsultationFee());
        BigDecimal rc  = nvl(request.getRoomCharges());
        BigDecimal mc  = nvl(request.getMedicationCharges());
        BigDecimal oc  = nvl(request.getOtherCharges());
        billing.setConsultationFee(cf);
        billing.setRoomCharges(rc);
        billing.setMedicationCharges(mc);
        billing.setOtherCharges(oc);
        billing.setTotalAmount(cf.add(rc).add(mc).add(oc));
        billing.setPaymentStatus(request.getPaymentStatus());
        billing.setPaymentDate(request.getPaymentDate());
        billing.setPaymentMethod(request.getPaymentMethod());
        billing.setNotes(request.getNotes());
        return mapToResponse(billingRepository.save(billing));
    }

    @Override
    @Transactional
    public BillingResponse updatePaymentStatus(Long id, PaymentStatus status) {
        Billing billing = findById(id);
        billing.setPaymentStatus(status);
        if (status == PaymentStatus.PAID) billing.setPaymentDate(LocalDate.now());
        return mapToResponse(billingRepository.save(billing));
    }

    @Override
    @Transactional
    public void deleteBill(Long id) {
        billingRepository.delete(findById(id));
    }

    @Override
    public BigDecimal getTotalRevenue() {
        return billingRepository.getTotalRevenue();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Billing findById(Long id) {
        return billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", id));
    }

    private String generateInvoiceNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("INV-%s-%05d", date, billingRepository.count() + 1);
    }

    private BigDecimal nvl(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private BillingResponse mapToResponse(Billing b) {
        BillingResponse r = new BillingResponse();
        r.setId(b.getId());
        r.setInvoiceNumber(b.getInvoiceNumber());
        r.setPatientId(b.getPatient().getId());
        r.setPatientName(b.getPatient().getFirstName() + " " + b.getPatient().getLastName());
        if (b.getAppointment() != null) r.setAppointmentId(b.getAppointment().getId());
        r.setConsultationFee(b.getConsultationFee());
        r.setRoomCharges(b.getRoomCharges());
        r.setMedicationCharges(b.getMedicationCharges());
        r.setOtherCharges(b.getOtherCharges());
        r.setTotalAmount(b.getTotalAmount());
        r.setPaymentStatus(b.getPaymentStatus());
        r.setPaymentDate(b.getPaymentDate());
        r.setPaymentMethod(b.getPaymentMethod());
        r.setNotes(b.getNotes());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }
}
