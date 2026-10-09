package com.spms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor
public class Notification {
    @Id @GeneratedValue private UUID id;
    @Column(nullable = false) private String recipient;
    @Column(length = 1000) private String message;
    @Column(name = "is_read") private boolean read;
    private LocalDateTime createdAt = LocalDateTime.now();
}
