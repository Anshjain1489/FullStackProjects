package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.RoomRequest;
import com.hospital.hms.dto.response.RoomResponse;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Room;
import com.hospital.hms.enums.RoomStatus;
import com.hospital.hms.enums.RoomType;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ConflictException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.RoomRepository;
import com.hospital.hms.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final PatientRepository patientRepository;

    @Override
    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        if (roomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new ConflictException("Room " + request.getRoomNumber() + " already exists");
        }
        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .roomType(request.getRoomType())
                .status(request.getStatus())
                .floor(request.getFloor())
                .pricePerDay(request.getPricePerDay())
                .build();
        return mapToResponse(roomRepository.save(room));
    }

    @Override
    public RoomResponse getRoomById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public RoomResponse getRoomByRoomNumber(String roomNumber) {
        return mapToResponse(roomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "roomNumber", roomNumber)));
    }

    @Override
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<RoomResponse> getRoomsByStatus(RoomStatus status) {
        return roomRepository.findByStatus(status).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<RoomResponse> getRoomsByType(RoomType roomType) {
        return roomRepository.findByRoomType(roomType).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<RoomResponse> getAvailableRooms() {
        return roomRepository.findByStatus(RoomStatus.AVAILABLE).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = findById(id);
        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(request.getRoomType());
        room.setStatus(request.getStatus());
        room.setFloor(request.getFloor());
        room.setPricePerDay(request.getPricePerDay());
        return mapToResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponse admitPatient(Long roomId, Long patientId, LocalDate admissionDate) {
        Room room = findById(roomId);
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new BadRequestException("Room " + room.getRoomNumber() + " is not available (status: " + room.getStatus() + ")");
        }
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));
        room.setCurrentPatient(patient);
        room.setStatus(RoomStatus.OCCUPIED);
        room.setAdmissionDate(admissionDate != null ? admissionDate : LocalDate.now());
        return mapToResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponse dischargePatient(Long roomId) {
        Room room = findById(roomId);
        if (room.getStatus() != RoomStatus.OCCUPIED) {
            throw new BadRequestException("Room " + room.getRoomNumber() + " has no admitted patient");
        }
        room.setCurrentPatient(null);
        room.setStatus(RoomStatus.AVAILABLE);
        room.setAdmissionDate(null);
        return mapToResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        roomRepository.delete(findById(id));
    }

    private Room findById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
    }

    private RoomResponse mapToResponse(Room r) {
        RoomResponse res = new RoomResponse();
        res.setId(r.getId());
        res.setRoomNumber(r.getRoomNumber());
        res.setRoomType(r.getRoomType());
        res.setStatus(r.getStatus());
        res.setFloor(r.getFloor());
        res.setPricePerDay(r.getPricePerDay());
        res.setAdmissionDate(r.getAdmissionDate());
        res.setCreatedAt(r.getCreatedAt());
        if (r.getCurrentPatient() != null) {
            res.setCurrentPatientId(r.getCurrentPatient().getId());
            res.setCurrentPatientName(r.getCurrentPatient().getFirstName() + " " + r.getCurrentPatient().getLastName());
        }
        return res;
    }
}
