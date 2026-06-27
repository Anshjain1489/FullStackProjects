package com.hospital.hms.controller;

import com.hospital.hms.dto.request.MedicalRecordRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.MedicalRecordResponse;
import com.hospital.hms.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
@Tag(name = "Medical Records", description = "Patient medical record management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Create a new medical record")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> createRecord(
            @Valid @RequestBody MedicalRecordRequest request) {
        MedicalRecordResponse response = medicalRecordService.createRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medical record created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get medical record by database ID")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getRecordById(@PathVariable Long id) {
        MedicalRecordResponse response = medicalRecordService.getRecordById(id);
        return ResponseEntity.ok(ApiResponse.success("Medical record fetched successfully", response));
    }

    @GetMapping("/rid/{recordId}")
    @Operation(summary = "Get medical record by record ID (e.g. REC-001)")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getRecordByRecordId(
            @PathVariable String recordId) {
        MedicalRecordResponse response = medicalRecordService.getRecordByRecordId(recordId);
        return ResponseEntity.ok(ApiResponse.success("Medical record fetched successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all medical records")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getAllRecords() {
        List<MedicalRecordResponse> response = medicalRecordService.getAllRecords();
        return ResponseEntity.ok(ApiResponse.success("Medical records fetched successfully", response));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get medical records by patient ID")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getRecordsByPatient(
            @PathVariable Long patientId) {
        List<MedicalRecordResponse> response = medicalRecordService.getRecordsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.success("Patient medical records fetched successfully", response));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get medical records by doctor ID")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getRecordsByDoctor(
            @PathVariable Long doctorId) {
        List<MedicalRecordResponse> response = medicalRecordService.getRecordsByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.success("Doctor medical records fetched successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Update medical record by ID")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> updateRecord(
            @PathVariable Long id,
            @Valid @RequestBody MedicalRecordRequest request) {
        MedicalRecordResponse response = medicalRecordService.updateRecord(id, request);
        return ResponseEntity.ok(ApiResponse.success("Medical record updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete medical record by ID")
    public ResponseEntity<ApiResponse<Void>> deleteRecord(@PathVariable Long id) {
        medicalRecordService.deleteRecord(id);
        return ResponseEntity.ok(ApiResponse.success("Medical record deleted successfully"));
    }
}
