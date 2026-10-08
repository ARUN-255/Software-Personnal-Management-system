package com.spms.config;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.spms.entity.*;
import com.spms.repository.*;
import java.time.*;
@Configuration @RequiredArgsConstructor public class DataInitializer {
    private final UserAccountRepository users;
    private final EmployeeRepository employees;
    private final DepartmentRepository departments;
    private final DesignationRepository designations;
    private final PasswordEncoder encoder;
    @Bean CommandLineRunner seed() {
        return args-> {
            var eng=departments.findByNameIgnoreCase("Engineering").orElseGet(()->departments.save(new Department("Engineering")));
            var dev=designations.findByTitleIgnoreCase("Software Developer").orElseGet(()->designations.save(new Designation("Software Developer")));
            create("owner", "Owner@123", UserAccount.Role.OWNER, false);
            create("admin", "Admin@123", UserAccount.Role.ADMIN, false);
            if(users.findByUsername("employee").isEmpty()) {
                var u=create("employee", "Employee@123", UserAccount.Role.EMPLOYEE, true);
                var e=new Employee();
                e.setEmployeeCode("EMP-001");
                e.setUserAccount(u);
                e.setFullName("Demo Employee");
                e.setEmail("employee@example.com");
                e.setDepartment(eng);
                e.setDesignation(dev);
                e.setJoiningDate(LocalDate.now());
                employees.save(e);
            }
        }
        ;
    }
    private UserAccount create(String n, String p, UserAccount.Role r, boolean change) {
        return users.findByUsername(n).orElseGet(()-> {
            var u=new UserAccount(); u.setUsername(n); u.setPasswordHash(encoder.encode(p)); u.setRole(r); u.setMustChangePassword(change); return users.save(u);
        }
        );
    }
}
