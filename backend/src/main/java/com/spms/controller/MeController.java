package com.spms.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.spms.entity.*;
import com.spms.service.*;
import java.util.*;
@RestController @RequestMapping("/api/me") @RequiredArgsConstructor public class MeController {
    private final EmployeeService employees;
    private final AttendanceService attendance;
    private final PayrollService payroll;
    private final DocumentService documents;
    @GetMapping public Employee me(Authentication a) {
        return employees.me(a.getName());
    }
    @GetMapping("/attendance")public List<AttendanceRecord> attendance(Authentication a) {
        return attendance.forEmployee(employees.me(a.getName()).getId());
    }
    @GetMapping("/payroll")public List<PayrollRecord> payroll(Authentication a) {
        return payroll.forEmployee(employees.me(a.getName()).getId(), true);
    }
    @GetMapping("/documents")public List<EmployeeDocument> documents(Authentication a) {
        return documents.list(employees.me(a.getName()).getId());
    }
}
