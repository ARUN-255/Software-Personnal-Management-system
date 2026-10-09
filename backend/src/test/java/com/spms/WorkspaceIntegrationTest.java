package com.spms;

import com.spms.entity.*;
import com.spms.repository.*;
import com.spms.service.WorkService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:upgrade;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "app.demo-data=false", "app.gemini.api-key=", "app.gemini.model=", "app.storage.provider=local"})
@AutoConfigureMockMvc @Transactional
class WorkspaceIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserAccountRepository users;
    @Autowired EmployeeRepository employees;
    @Autowired DepartmentRepository departments;
    @Autowired DesignationRepository designations;
    @Autowired PayrollRepository payroll;
    @Autowired NotificationRepository notifications;
    @Autowired WorkRequestRepository requests;
    @Autowired WorkService work;
    @Autowired PasswordEncoder encoder;
    Employee employee;
    Employee other;

    @BeforeEach void setup() {
        account("admin-test", UserAccount.Role.ADMIN);
        employee = employee("employee-test", "T001");
        other = employee("other-test", "T002");
    }
    UserAccount account(String name, UserAccount.Role role) {
        var user = new UserAccount(); user.setUsername(name); user.setRole(role);
        user.setPasswordHash(encoder.encode("Test-password-123")); return users.save(user);
    }
    Employee employee(String name, String code) {
        var employee = new Employee(); employee.setEmployeeCode(code); employee.setFullName(name);
        employee.setUserAccount(account(name, UserAccount.Role.EMPLOYEE));
        employee.setDepartment(departments.save(new Department("Dept-" + code)));
        employee.setDesignation(designations.save(new Designation("Role-" + code)));
        employee.setJoiningDate(LocalDate.now()); return employees.save(employee);
    }
    @Test void profileDoesNotExposePasswordHash() throws Exception {
        mvc.perform(get("/api/me").with(user("employee-test").roles("EMPLOYEE")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userAccount.passwordHash").doesNotExist());
    }
    @Test void csrfAndRolesAreEnforced() throws Exception {
        mvc.perform(post("/api/me/check-in").with(user("employee-test").roles("EMPLOYEE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/audit").with(user("employee-test").roles("EMPLOYEE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/workspace/reports").param("month", "2026-10")).andExpect(status().isUnauthorized());
    }
    @Test void clockInCannotBeDuplicatedAndCheckoutRequiresCheckin() throws Exception {
        mvc.perform(post("/api/me/check-out").with(user("employee-test").roles("EMPLOYEE")).with(csrf())).andExpect(status().isBadRequest());
        mvc.perform(post("/api/me/check-in").with(user("employee-test").roles("EMPLOYEE")).with(csrf())).andExpect(status().isOk());
        mvc.perform(post("/api/me/check-in").with(user("employee-test").roles("EMPLOYEE")).with(csrf())).andExpect(status().isBadRequest());
        mvc.perform(post("/api/me/check-out").with(user("employee-test").roles("EMPLOYEE")).with(csrf())).andExpect(status().isOk());
    }
    @Test void leaveOverlapAndRepeatedDecisionAreRejected() {
        var day = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(2);
        var input = new WorkService.NewRequest(WorkRequest.Kind.LEAVE, day, day.plusDays(1), "Family event", null);
        var request = work.request("employee-test", input);
        assertThrows(IllegalArgumentException.class, () -> work.request("employee-test", input));
        work.decide(request.getId(), new WorkService.Decision(true, "Approved"), "admin-test");
        assertThrows(IllegalArgumentException.class, () -> work.decide(request.getId(), new WorkService.Decision(false, "No"), "admin-test"));
        assertFalse(notifications.findTop100ByRecipientOrderByCreatedAtDesc("employee-test").isEmpty());
    }
    @Test void employeeCannotSeeOtherRequestsOrNotifications() throws Exception {
        var day = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(2);
        work.request("other-test", new WorkService.NewRequest(WorkRequest.Kind.LEAVE, day, day, "Private reason", null));
        mvc.perform(get("/api/workspace/requests").with(user("employee-test").roles("EMPLOYEE"))).andExpect(jsonPath("$.length()").value(0));
        var note = new Notification(); note.setRecipient("other-test"); note.setMessage("Private"); notifications.save(note);
        mvc.perform(post("/api/workspace/notifications/" + note.getId() + "/read").with(user("employee-test").roles("EMPLOYEE")).with(csrf())).andExpect(status().isNotFound());
    }
    @Test void payslipIsScopedAndGeneratedAsPdf() throws Exception {
        var pay = new PayrollRecord(); pay.setEmployee(employee); pay.setPayPeriod(LocalDate.now().withDayOfMonth(1));
        pay.setStatus(PayrollRecord.Status.PUBLISHED); pay.setPublishedAt(LocalDateTime.now()); payroll.save(pay);
        mvc.perform(get("/api/workspace/payslips/" + pay.getId() + ".pdf").with(user("other-test").roles("EMPLOYEE"))).andExpect(status().isForbidden());
        var bytes = mvc.perform(get("/api/workspace/payslips/" + pay.getId() + ".pdf").with(user("employee-test").roles("EMPLOYEE")))
                .andExpect(status().isOk()).andExpect(content().contentType(MediaType.APPLICATION_PDF)).andReturn().getResponse().getContentAsByteArray();
        assertEquals("%PDF-", new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII));
    }
    @Test void unconfiguredAiReturnsActionableError() throws Exception {
        mvc.perform(post("/api/workspace/assistant").with(user("employee-test").roles("EMPLOYEE")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("month", "2026-10", "question", "Explain attendance"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("GEMINI_API_KEY")));
    }
    @Test void attendanceCorrectionUpdatesTheRecord() {
        var day = LocalDate.now(ZoneId.of("Asia/Kolkata")).minusDays(1);
        var request = work.request("employee-test", new WorkService.NewRequest(WorkRequest.Kind.ATTENDANCE, day, day, "Missed clock", "PRESENT"));
        var decision = work.decide(request.getId(), new WorkService.Decision(true, "Verified"), "admin-test");
        assertEquals(WorkRequest.Status.APPROVED, decision.getStatus());
    }
}
