package com.spms.entity;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor
public class WorkRequest {
    public enum Kind { LEAVE, ATTENDANCE }
    public enum Status { PENDING, APPROVED, REJECTED }
    @Id @GeneratedValue private UUID id;
    @ManyToOne(optional = false) private Employee employee;
    @Enumerated(EnumType.STRING) private Kind kind;
    private LocalDate startDate;
    private LocalDate endDate;
    @Column(length = 1000) private String reason;
    private String requestedAttendanceStatus;
    @Enumerated(EnumType.STRING) private Status status = Status.PENDING;
    @Column(length = 1000) private String reviewerComment;
    private String reviewedBy;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime reviewedAt;
    @Version private Long version;
}
