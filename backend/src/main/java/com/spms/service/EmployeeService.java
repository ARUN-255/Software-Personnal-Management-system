package com.spms.service;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.spms.dto.Dtos;
import com.spms.entity.*;
import com.spms.repository.*;
import java.util.*;
@Service @RequiredArgsConstructor public class EmployeeService {
    private final EmployeeRepository employees;
    private final UserAccountRepository users;
    private final DepartmentRepository departments;
    private final DesignationRepository designations;
    private final PasswordEncoder encoder;
    public Employee me(String username) {
        return employees.findByUserAccountUsername(username).orElseThrow(()->new NoSuchElementException("Employee profile not found"));
    }
    public Page<Employee> list(String q, int page) {
        return employees.findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(q, q, PageRequest.of(page, 12));
    }
    public Employee get(UUID id) {
        return employees.findById(id).orElseThrow();
    }
    @Transactional public Employee create(Dtos.EmployeeRequest r) {
        if(users.findByUsername(r.username()).isPresent()||employees.findByEmployeeCode(r.employeeCode()).isPresent())throw new IllegalArgumentException("Username or employee code already exists");
        var u=new UserAccount();
        u.setUsername(r.username());
        u.setPasswordHash(encoder.encode(r.temporaryPassword()));
        u.setRole(UserAccount.Role.EMPLOYEE);
        u=users.save(u);
        var e=new Employee();
        apply(e, r);
        e.setUserAccount(u);
        return employees.save(e);
    }
    public Employee update(UUID id, Dtos.EmployeeRequest r) {
        var e=get(id);
        apply(e, r);
        return employees.save(e);
    }
    private void apply(Employee e, Dtos.EmployeeRequest r) {
        e.setEmployeeCode(r.employeeCode());
        e.setFullName(r.fullName());
        e.setEmail(r.email());
        e.setPhone(r.phone());
        e.setAddress(r.address());
        e.setDateOfBirth(r.dateOfBirth());
        e.setDepartment(departments.findById(r.departmentId()).orElseThrow());
        e.setDesignation(designations.findById(r.designationId()).orElseThrow());
        e.setJoiningDate(r.joiningDate());
    }
    public void deactivate(UUID id) {
        var e=get(id);
        e.setEmploymentStatus(Employee.Status.INACTIVE);
        e.getUserAccount().setEnabled(false);
        users.save(e.getUserAccount());
        employees.save(e);
    }
}
