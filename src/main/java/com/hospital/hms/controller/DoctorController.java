package com.hospital.hms.controller;

import com.hospital.hms.dto.request.DoctorRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.DoctorResponse;
import com.hospital.hms.service.DoctorService;
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
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Doctor management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a new doctor")
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(
            @Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor by database ID")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        DoctorResponse response = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor fetched successfully", response));
    }

    @GetMapping("/did/{doctorId}")
    @Operation(summary = "Get doctor by doctor ID (e.g. DOC-001)")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorByDoctorId(
            @PathVariable String doctorId) {
        DoctorResponse response = doctorService.getDoctorByDoctorId(doctorId);
        return ResponseEntity.ok(ApiResponse.success("Doctor fetched successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all doctors")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctors() {
        List<DoctorResponse> response = doctorService.getAllDoctors();
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully", response));
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "Get doctors by department")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getDoctorsByDepartment(
            @PathVariable Long departmentId) {
        List<DoctorResponse> response = doctorService.getDoctorsByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully", response));
    }

    @GetMapping("/available")
    @Operation(summary = "Get all available doctors")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAvailableDoctors() {
        List<DoctorResponse> response = doctorService.getAvailableDoctors();
        return ResponseEntity.ok(ApiResponse.success("Available doctors fetched successfully", response));
    }

    @GetMapping("/search")
    @Operation(summary = "Search doctors by keyword (name, specialization)")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> searchDoctors(
            @RequestParam String keyword) {
        List<DoctorResponse> response = doctorService.searchDoctors(keyword);
        return ResponseEntity.ok(ApiResponse.success("Search results fetched successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update doctor by ID")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.updateDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete doctor by ID")
    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor deleted successfully"));
    }
}
