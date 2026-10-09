package com.spms.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.*;
import java.time.*;
import com.spms.entity.*;
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from Employee e where e.id = :id")
    Optional<Employee> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
    Optional<Employee> findByUserAccountUsername(String username);
    Optional<Employee> findByEmployeeCode(String code);
    Page<Employee> findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(String name, String code, Pageable pageable);
}
