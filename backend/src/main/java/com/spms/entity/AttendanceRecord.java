package com.spms.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;
@Entity @Table(uniqueConstraints=@UniqueConstraint(columnNames= {
    "employee_id", "work_date"
}
)) @Getter @Setter @NoArgsConstructor public class AttendanceRecord {
    public enum Status {
        PRESENT, ABSENT, HALF_DAY, HOLIDAY
    }
    @Id @GeneratedValue private UUID id;
    @ManyToOne(optional=false)private Employee employee;
    @Column(name="work_date")private LocalDate workDate;
    @Enumerated(EnumType.STRING)private Status status;
    private String remarks;
    private LocalDateTime checkedInAt;
    private LocalDateTime checkedOutAt;
    @Version private Long version;
    @ManyToOne private UserAccount updatedBy;
}
