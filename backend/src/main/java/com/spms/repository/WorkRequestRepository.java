package com.spms.repository;

import com.spms.entity.WorkRequest;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkRequestRepository extends JpaRepository<WorkRequest, UUID> {
    List<WorkRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);
    List<WorkRequest> findAllByOrderByCreatedAtDesc();
}
