package com.spms.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;
@Entity @Table(name="user_accounts") @Getter @Setter @NoArgsConstructor public class UserAccount {
    public enum Role {
        OWNER, ADMIN, EMPLOYEE
    }
    @Id @GeneratedValue private UUID id;
    @Column(unique=true, nullable=false) private String username;
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable=false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
    private boolean enabled=true;
    private boolean mustChangePassword=true;
    private LocalDateTime createdAt=LocalDateTime.now();
}
