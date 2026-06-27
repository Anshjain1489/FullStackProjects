package com.hospital.hms.repository;

import com.hospital.hms.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientId(String patientId);
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByPhone(String phone);
    boolean existsByPatientId(String patientId);

    @Query("SELECT p FROM Patient p WHERE " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
            "LOWER(p.lastName)  LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
            "LOWER(p.email)     LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
            "p.phone            LIKE CONCAT('%', :kw, '%') OR " +
            "p.patientId        LIKE CONCAT('%', :kw, '%')")
    List<Patient> searchPatients(@Param("kw") String keyword);
}
