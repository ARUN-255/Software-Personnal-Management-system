package com.spms.controller;

import com.spms.entity.*;
import com.spms.repository.*;
import com.spms.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class WorkspaceController {
    private final WorkService work;
    private final WorkRequestRepository requests;
    private final NotificationRepository notifications;
    private final NotificationService notify;
    private final ReportService reports;
    private final AssistantService assistant;
    private final PayrollRepository payroll;
    private final EmployeeRepository employees;
    private final AuditEventRepository audit;

    private boolean admin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
    private UUID scope(Authentication auth) { return admin(auth) ? null : work.employee(auth.getName()).getId(); }

    @GetMapping("/api/workspace/requests")
    public List<WorkRequest> requests(Authentication auth) {
        return admin(auth) ? requests.findAllByOrderByCreatedAtDesc()
                : requests.findByEmployeeIdOrderByCreatedAtDesc(scope(auth));
    }

    @PostMapping("/api/me/requests")
    public WorkRequest request(Authentication auth, @Valid @RequestBody WorkService.NewRequest input) {
        return work.request(auth.getName(), input);
    }

    @PostMapping("/api/admin/requests/{id}/decision")
    public WorkRequest decision(Authentication auth, @PathVariable UUID id, @Valid @RequestBody WorkService.Decision input) {
        return work.decide(id, input, auth.getName());
    }

    @PostMapping("/api/me/check-in") public AttendanceRecord checkIn(Authentication auth) { return work.clock(auth.getName(), false); }
    @PostMapping("/api/me/check-out") public AttendanceRecord checkOut(Authentication auth) { return work.clock(auth.getName(), true); }

    @GetMapping("/api/workspace/notifications")
    public org.springframework.data.domain.Page<Notification> notifications(Authentication auth,
            @RequestParam(defaultValue = "0") int page) {
        return notifications.findByRecipientOrderByCreatedAtDesc(auth.getName(),
                org.springframework.data.domain.PageRequest.of(page, 12));
    }

    @PostMapping("/api/workspace/notifications/{id}/read")
    public void read(Authentication auth, @PathVariable UUID id) {
        var note = notifications.findByIdAndRecipient(id, auth.getName()).orElseThrow();
        note.setRead(true);
        notifications.save(note);
    }

    @GetMapping("/api/workspace/reports")
    public Map<String, Object> report(Authentication auth, @RequestParam String month) {
        return reports.summary(YearMonth.parse(month), scope(auth));
    }

    @GetMapping("/api/admin/reports/attendance.csv")
    public ResponseEntity<String> csv(@RequestParam String month) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance.csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(reports.csv(YearMonth.parse(month)));
    }
    @GetMapping("/api/admin/reports/attendance.xlsx")
    public ResponseEntity<byte[]> xlsx(@RequestParam String month) throws Exception {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance-" + month + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(reports.xlsx(YearMonth.parse(month)));
    }

    @GetMapping("/api/workspace/payslips/{id}.pdf")
    public ResponseEntity<byte[]> payslip(Authentication auth, @PathVariable UUID id) throws Exception {
        var record = payroll.findById(id).orElseThrow();
        if (!admin(auth) && !record.getEmployee().getId().equals(scope(auth))) return ResponseEntity.status(403).build();
        if (record.getStatus() != PayrollRecord.Status.PUBLISHED) throw new IllegalArgumentException("Publish the payroll before downloading a payslip");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip-" + record.getPayPeriod() + ".pdf")
                .body(reports.payslip(record));
    }

    public record ChatTurn(@NotBlank @Pattern(regexp = "user|model") String role,
            @NotBlank @Size(max = 8000) String text) {}
    public record Question(@NotBlank @Size(max = 2000) String question, @NotBlank String month,
            @Pattern(regexp = "en|ta") String language,
            @Size(max = 12) List<@Valid ChatTurn> history) {}

    @GetMapping("/api/workspace/assistant/status")
    public Map<String, Boolean> aiStatus() { return Map.of("configured", assistant.configured()); }

    @PostMapping("/api/workspace/assistant")
    public Map<String, String> ask(Authentication auth, @Valid @RequestBody Question input) throws Exception {
        var month = YearMonth.parse(input.month());
        var context = new LinkedHashMap<>(reports.summary(month, scope(auth)));
        context.remove("missingCertificates"); // No coworker names or IDs are sent to Gemini.
        context.put("role", admin(auth) ? "ADMIN" : "EMPLOYEE");
        if (!admin(auth)) {
            var employee = work.employee(auth.getName());
            context.put("designation", employee.getDesignation().getTitle());
            context.put("department", employee.getDepartment().getName());
            context.put("payroll", payroll.findByEmployeeIdAndStatusOrderByPayPeriodDesc(employee.getId(), PayrollRecord.Status.PUBLISHED)
                    .stream().filter(p -> YearMonth.from(p.getPayPeriod()).equals(month))
                    .map(p -> Map.of("basic", p.getBasicPay(), "allowances", p.getAllowances(), "deductions", p.getDeductions(), "net", p.getNetPay())).toList());
        }
        return Map.of("answer", assistant.answer(auth.getName(), input.question(), context,
                input.language() == null ? "en" : input.language(), input.history() == null ? List.of() : input.history().stream().map(turn -> Map.of("role", turn.role(), "text", turn.text())).toList()));
    }

    @GetMapping("/api/admin/audit")
    public org.springframework.data.domain.Page<AuditEvent> audit(@RequestParam(defaultValue = "0") int page) {
        return audit.findAll(org.springframework.data.domain.PageRequest.of(page, 20,
                org.springframework.data.domain.Sort.by("timestamp").descending()));
    }

    @PostMapping("/api/admin/employees/{id}/certificate-reminder")
    public void remind(@PathVariable UUID id) {
        var employee = employees.findById(id).orElseThrow();
        notify.send(employee.getUserAccount().getUsername(), "Please contact your administrator to upload your missing certificate.");
    }
}
