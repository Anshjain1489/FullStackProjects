package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.DepartmentRequest;
import com.hospital.hms.dto.response.DepartmentResponse;
import com.hospital.hms.entity.Department;
import com.hospital.hms.exception.ConflictException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new ConflictException("Department '" + request.getName() + "' already exists");
        }
        Department dept = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .phone(request.getPhone())
                .headDoctorId(request.getHeadDoctorId())
                .active(request.isActive())
                .build();
        return mapToResponse(departmentRepository.save(dept));
    }

    @Override
    public DepartmentResponse getDepartmentById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<DepartmentResponse> getActiveDepartments() {
        return departmentRepository.findByActiveTrue().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department dept = findById(id);
        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        dept.setLocation(request.getLocation());
        dept.setPhone(request.getPhone());
        dept.setHeadDoctorId(request.getHeadDoctorId());
        dept.setActive(request.isActive());
        return mapToResponse(departmentRepository.save(dept));
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        departmentRepository.delete(findById(id));
    }

    private Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
    }

    private DepartmentResponse mapToResponse(Department d) {
        DepartmentResponse r = new DepartmentResponse();
        r.setId(d.getId());
        r.setName(d.getName());
        r.setDescription(d.getDescription());
        r.setLocation(d.getLocation());
        r.setPhone(d.getPhone());
        r.setHeadDoctorId(d.getHeadDoctorId());
        r.setActive(d.isActive());
        r.setCreatedAt(d.getCreatedAt());
        r.setTotalDoctors(doctorRepository.findByDepartmentId(d.getId()).size());
        if (d.getHeadDoctorId() != null) {
            doctorRepository.findById(d.getHeadDoctorId()).ifPresent(doc ->
                    r.setHeadDoctorName("Dr. " + doc.getFirstName() + " " + doc.getLastName()));
        }
        return r;
    }
}
