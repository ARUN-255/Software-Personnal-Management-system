package com.spms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor
public class PasswordResetToken {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(optional = false) private UserAccount user;
    @Column(nullable = false) private String codeHash;
    @Column(nullable = false) private LocalDateTime expiresAt;
    private boolean used;
    private LocalDateTime createdAt = LocalDateTime.now();
}
