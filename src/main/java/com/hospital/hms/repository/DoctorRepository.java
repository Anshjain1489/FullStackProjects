package com.hospital.hms.repository;

import com.hospital.hms.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByDoctorId(String doctorId);
    Optional<Doctor> findByEmail(String email);
    List<Doctor> findByDepartmentId(Long departmentId);
    List<Doctor> findByAvailableTrue();

    @Query("SELECT d FROM Doctor d WHERE " +
            "LOWER(d.firstName)      LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
            "LOWER(d.lastName)       LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
            "LOWER(d.specialization) LIKE LOWER(CONCAT('%', :kw, '%'))")
    List<Doctor> searchDoctors(@Param("kw") String keyword);
}
