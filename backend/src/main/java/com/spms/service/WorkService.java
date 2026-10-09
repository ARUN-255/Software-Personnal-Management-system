package com.spms.service;

import com.spms.entity.*;
import com.spms.repository.*;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class WorkService {
    private final WorkRequestRepository requests;
    private final EmployeeRepository employees;
    private final AttendanceRepository attendance;
    private final NotificationService notifications;
    @Value("${app.time-zone:Asia/Kolkata}") private String timeZone;

    public record NewRequest(@NotNull WorkRequest.Kind kind, @NotNull LocalDate startDate,
            @NotNull LocalDate endDate, @NotBlank @Size(max = 1000) String reason,
            String requestedAttendanceStatus) {}
    public record Decision(boolean approve, @NotBlank @Size(max = 1000) String comment) {}

    public Employee employee(String username) {
        var employee = employees.findByUserAccountUsername(username).orElseThrow();
        if (employee.getEmploymentStatus() == Employee.Status.INACTIVE)
            throw new IllegalArgumentException("Employee account is inactive");
        return employee;
    }

    @Transactional
    public WorkRequest request(String username, NewRequest input) {
        var employee = employee(username);
        employees.lockById(employee.getId());
        LocalDate today = LocalDate.now(ZoneId.of(timeZone));
        if (input.endDate().isBefore(input.startDate()) || input.endDate().isAfter(input.startDate().plusDays(365)))
            throw new IllegalArgumentException("Choose a valid date range of at most 366 days");
        if (input.kind() == WorkRequest.Kind.LEAVE) {
            if (input.startDate().isBefore(today)) throw new IllegalArgumentException("Leave cannot start in the past");
            boolean overlap = requests.findByEmployeeIdOrderByCreatedAtDesc(employee.getId()).stream()
                    .anyMatch(r -> r.getKind() == WorkRequest.Kind.LEAVE && r.getStatus() != WorkRequest.Status.REJECTED
                            && !r.getEndDate().isBefore(input.startDate()) && !r.getStartDate().isAfter(input.endDate()));
            if (overlap) throw new IllegalArgumentException("A pending or approved leave request overlaps these dates");
        } else {
            if (!input.startDate().equals(input.endDate()) || input.startDate().isAfter(today))
                throw new IllegalArgumentException("Attendance corrections need one date, today or earlier");
            try { AttendanceRecord.Status.valueOf(input.requestedAttendanceStatus()); }
            catch (Exception e) { throw new IllegalArgumentException("Select an attendance status"); }
        }
        var request = new WorkRequest();
        request.setEmployee(employee);
        request.setKind(input.kind());
        request.setStartDate(input.startDate());
        request.setEndDate(input.endDate());
        request.setReason(input.reason());
        request.setRequestedAttendanceStatus(input.requestedAttendanceStatus());
        requests.save(request);
        notifications.notifyAdmins(employee.getFullName() + " submitted a " + input.kind().name().toLowerCase() + " request.");
        return request;
    }

    @Transactional
    public WorkRequest decide(UUID id, Decision decision, String reviewer) {
        var request = requests.findById(id).orElseThrow();
        if (request.getStatus() != WorkRequest.Status.PENDING)
            throw new IllegalArgumentException("This request has already been reviewed");
        request.setStatus(decision.approve() ? WorkRequest.Status.APPROVED : WorkRequest.Status.REJECTED);
        request.setReviewerComment(decision.comment());
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now(ZoneId.of(timeZone)));
        if (decision.approve() && request.getKind() == WorkRequest.Kind.ATTENDANCE) {
            employees.lockById(request.getEmployee().getId());
            var record = attendance.findByEmployeeIdAndWorkDate(request.getEmployee().getId(), request.getStartDate())
                    .orElseGet(AttendanceRecord::new);
            record.setEmployee(request.getEmployee());
            record.setWorkDate(request.getStartDate());
            record.setStatus(AttendanceRecord.Status.valueOf(request.getRequestedAttendanceStatus()));
            record.setRemarks("Correction approved by " + reviewer + ": " + decision.comment());
            attendance.save(record);
        }
        notifications.send(request.getEmployee().getUserAccount().getUsername(),
                request.getKind() + " request " + request.getStatus().name().toLowerCase() + ": " + decision.comment());
        return requests.save(request);
    }

    @Transactional
    public AttendanceRecord clock(String username, boolean checkOut) {
        var employee = employee(username);
        employees.lockById(employee.getId());
        var now = LocalDateTime.now(ZoneId.of(timeZone));
        var record = attendance.findByEmployeeIdAndWorkDate(employee.getId(), now.toLocalDate())
                .orElseGet(AttendanceRecord::new);
        if (checkOut) {
            if (record.getCheckedInAt() == null || record.getCheckedOutAt() != null)
                throw new IllegalArgumentException("Check in first; each day permits one check-out");
            record.setCheckedOutAt(now);
        } else {
            if (record.getCheckedInAt() != null) throw new IllegalArgumentException("Already checked in today");
            if (record.getId() != null && record.getStatus() != AttendanceRecord.Status.PRESENT)
                throw new IllegalArgumentException("Ask your admin to correct today's attendance before checking in");
            record.setEmployee(employee);
            record.setWorkDate(now.toLocalDate());
            record.setStatus(AttendanceRecord.Status.PRESENT);
            record.setCheckedInAt(now);
        }
        return attendance.save(record);
    }
}
