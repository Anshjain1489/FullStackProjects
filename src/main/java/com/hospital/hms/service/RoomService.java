package com.hospital.hms.service;

import com.hospital.hms.dto.request.RoomRequest;
import com.hospital.hms.dto.response.RoomResponse;
import com.hospital.hms.enums.RoomStatus;
import com.hospital.hms.enums.RoomType;

import java.time.LocalDate;
import java.util.List;

public interface RoomService {
    RoomResponse createRoom(RoomRequest request);
    RoomResponse getRoomById(Long id);
    RoomResponse getRoomByRoomNumber(String roomNumber);
    List<RoomResponse> getAllRooms();
    List<RoomResponse> getRoomsByStatus(RoomStatus status);
    List<RoomResponse> getRoomsByType(RoomType roomType);
    List<RoomResponse> getAvailableRooms();
    RoomResponse updateRoom(Long id, RoomRequest request);
    RoomResponse admitPatient(Long roomId, Long patientId, LocalDate admissionDate);
    RoomResponse dischargePatient(Long roomId);
    void deleteRoom(Long id);
}
