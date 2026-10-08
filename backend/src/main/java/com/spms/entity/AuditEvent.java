package com.spms.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor public class AuditEvent {
    @Id @GeneratedValue private UUID id;
    @ManyToOne private UserAccount actor;
    private String action;
    private String targetType;
    private String targetId;
    private LocalDateTime timestamp=LocalDateTime.now();
    @Column(length=1000)private String changeSummary;
}
