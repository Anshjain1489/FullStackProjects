package com.hospital.hms.repository;

import com.hospital.hms.entity.Room;
import com.hospital.hms.enums.RoomStatus;
import com.hospital.hms.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    boolean existsByRoomNumber(String roomNumber);
    List<Room> findByStatus(RoomStatus status);
    List<Room> findByRoomType(RoomType roomType);
    List<Room> findByStatusAndRoomType(RoomStatus status, RoomType roomType);
}
