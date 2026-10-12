package com.spms.config;

import com.spms.entity.*;
import com.spms.repository.*;
import java.time.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "app.demo-data",
    havingValue = "true"
)
@RequiredArgsConstructor
public class DataInitializer {
    private final UserAccountRepository users;
    private final EmployeeRepository employees;
    private final DepartmentRepository departments;
    private final DesignationRepository designations;
    private final PasswordEncoder encoder;

    @Bean
    CommandLineRunner seed() {
        return args -> {
            var engineering = department("Engineering");
            var support = department("Support");
            var operations = department("Operations");
            var hr = department("Human Resources");

            var developer = designation("Software Developer");
            var engineer = designation("System Engineer");
            var analyst = designation("Business Analyst");
            var executive = designation("HR Executive");

            create("owner", "Owner@123", UserAccount.Role.OWNER, false);
            create("admin", "Admin@123", UserAccount.Role.ADMIN, false);

            seedEmployee("employee", "EMP-001", "Shreenevasan",
                "shreenevasan@bronzeralabs.com", "9876501001", engineering, developer, LocalDate.of(2024, 6, 10));
            seedEmployee("dinesh.kumar", "EMP-002", "Dinesh Kumar",
                "dinesh.kumar@bronzeralabs.com", "9876501002", support, engineer, LocalDate.of(2023, 11, 20));
            seedEmployee("madesh", "EMP-003", "Madesh",
                "madesh@bronzeralabs.com", "9876501003", operations, analyst, LocalDate.of(2025, 1, 8));
            seedEmployee("barath", "EMP-004", "Barath",
                "barath@bronzeralabs.com", "9876501004", engineering, developer, LocalDate.of(2024, 2, 15));
            seedEmployee("bharath.raj", "EMP-005", "Bharath Raj",
                "bharath.raj@bronzeralabs.com", "9876501005", hr, executive, LocalDate.of(2023, 8, 1));
            seedEmployee("madesh2", "EMP-006", "Madesh",
                "madesh2@bronzeralabs.com", "9876501006", support, engineer, LocalDate.of(2025, 3, 12));
            seedEmployee("satish.kumar", "EMP-007", "Satish Kumar",
                "satish.kumar@bronzeralabs.com", "9876501007", operations, analyst, LocalDate.of(2022, 12, 5));
            seedEmployee("arun", "EMP-008", "Arun",
                "arun@bronzeralabs.com", "9876501008", engineering, developer, LocalDate.of(2024, 7, 22));
            seedEmployee("siva.kumar", "EMP-009", "Siva Kumar",
                "siva.kumar@bronzeralabs.com", "9876501009", support, engineer, LocalDate.of(2023, 4, 18));
            seedEmployee("vinoth", "EMP-010", "Vinoth",
                "vinoth@bronzeralabs.com", "9876501010", operations, analyst, LocalDate.of(2024, 9, 9));
        };
    }

    private Department department(String name) {
        return departments.findByNameIgnoreCase(name)
            .orElseGet(() -> departments.save(new Department(name)));
    }

    private Designation designation(String title) {
        return designations.findByTitleIgnoreCase(title)
            .orElseGet(() -> designations.save(new Designation(title)));
    }

    private void seedEmployee(
        String username,
        String code,
        String name,
        String email,
        String phone,
        Department department,
        Designation designation,
        LocalDate joiningDate
    ) {
        var account = create(username, "Employee@123", UserAccount.Role.EMPLOYEE, true);
        var employee = employees.findByEmployeeCode(code).orElseGet(Employee::new);
        employee.setEmployeeCode(code);
        employee.setUserAccount(account);
        employee.setFullName(name);
        employee.setEmail(email);
        employee.setPhone(phone);
        employee.setAddress("Chennai, Tamil Nadu");
        employee.setDepartment(department);
        employee.setDesignation(designation);
        employee.setJoiningDate(joiningDate);
        employee.setEmploymentStatus(Employee.Status.ACTIVE);
        employees.save(employee);
    }

    private UserAccount create(
        String username,
        String password,
        UserAccount.Role role,
        boolean mustChangePassword
    ) {
        return users.findByUsername(username).orElseGet(() -> {
            var account = new UserAccount();
            account.setUsername(username);
            account.setPasswordHash(encoder.encode(password));
            account.setRole(role);
            account.setMustChangePassword(mustChangePassword);
            return users.save(account);
        });
    }
}
