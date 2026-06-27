package com.hospital.hms.controller;

import com.hospital.hms.dto.request.PatientRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.PatientResponse;
import com.hospital.hms.service.PatientService;
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
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "Patient management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Register a new patient")
    public ResponseEntity<ApiResponse<PatientResponse>> createPatient(
            @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.createPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Patient registered successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient by database ID")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable Long id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success("Patient fetched successfully", response));
    }

    @GetMapping("/pid/{patientId}")
    @Operation(summary = "Get patient by patient ID (e.g. PAT-001)")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientByPatientId(
            @PathVariable String patientId) {
        PatientResponse response = patientService.getPatientByPatientId(patientId);
        return ResponseEntity.ok(ApiResponse.success("Patient fetched successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all patients")
    public ResponseEntity<ApiResponse<List<PatientResponse>>> getAllPatients() {
        List<PatientResponse> response = patientService.getAllPatients();
        return ResponseEntity.ok(ApiResponse.success("Patients fetched successfully", response));
    }

    @GetMapping("/search")
    @Operation(summary = "Search patients by keyword (name, email, phone)")
    public ResponseEntity<ApiResponse<List<PatientResponse>>> searchPatients(
            @RequestParam String keyword) {
        List<PatientResponse> response = patientService.searchPatients(keyword);
        return ResponseEntity.ok(ApiResponse.success("Search results fetched successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Update patient by ID")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success("Patient updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete patient by ID")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.success("Patient deleted successfully"));
    }
}
