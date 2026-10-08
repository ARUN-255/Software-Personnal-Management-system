package com.spms.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor public class Designation {
    @Id @GeneratedValue private UUID id;
    @Column(unique=true, nullable=false)private String title;
    public Designation(String t) {
        title=t;
    }
}
