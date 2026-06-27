package com.hospital.hms.controller;

import com.hospital.hms.dto.request.RoomRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.RoomResponse;
import com.hospital.hms.enums.RoomStatus;
import com.hospital.hms.enums.RoomType;
import com.hospital.hms.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Tag(name = "Rooms", description = "Room and bed management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a new room")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody RoomRequest request) {
        RoomResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get room by database ID")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(@PathVariable Long id) {
        RoomResponse response = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success("Room fetched successfully", response));
    }

    @GetMapping("/number/{roomNumber}")
    @Operation(summary = "Get room by room number")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomByRoomNumber(
            @PathVariable String roomNumber) {
        RoomResponse response = roomService.getRoomByRoomNumber(roomNumber);
        return ResponseEntity.ok(ApiResponse.success("Room fetched successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> response = roomService.getAllRooms();
        return ResponseEntity.ok(ApiResponse.success("Rooms fetched successfully", response));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get rooms by status")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRoomsByStatus(
            @PathVariable RoomStatus status) {
        List<RoomResponse> response = roomService.getRoomsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success("Rooms by status fetched successfully", response));
    }

    @GetMapping("/type/{roomType}")
    @Operation(summary = "Get rooms by type")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRoomsByType(
            @PathVariable RoomType roomType) {
        List<RoomResponse> response = roomService.getRoomsByType(roomType);
        return ResponseEntity.ok(ApiResponse.success("Rooms by type fetched successfully", response));
    }

    @GetMapping("/available")
    @Operation(summary = "Get all available rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAvailableRooms() {
        List<RoomResponse> response = roomService.getAvailableRooms();
        return ResponseEntity.ok(ApiResponse.success("Available rooms fetched successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update room by ID")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request) {
        RoomResponse response = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated successfully", response));
    }

    @PatchMapping("/{roomId}/admit/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Admit a patient to a room")
    public ResponseEntity<ApiResponse<RoomResponse>> admitPatient(
            @PathVariable Long roomId,
            @PathVariable Long patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate admissionDate) {
        RoomResponse response = roomService.admitPatient(roomId, patientId, admissionDate);
        return ResponseEntity.ok(ApiResponse.success("Patient admitted to room successfully", response));
    }

    @PatchMapping("/{roomId}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Discharge a patient from a room")
    public ResponseEntity<ApiResponse<RoomResponse>> dischargePatient(@PathVariable Long roomId) {
        RoomResponse response = roomService.dischargePatient(roomId);
        return ResponseEntity.ok(ApiResponse.success("Patient discharged successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete room by ID")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted successfully"));
    }
}
