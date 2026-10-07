package com.spms.entity;
import jakarta.persistence.*;import lombok.*;import java.time.*;import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor public class Employee {public enum Status{ACTIVE,INACTIVE}
 @Id @GeneratedValue private UUID id;@Column(unique=true,nullable=false)private String employeeCode;@OneToOne(optional=false)private UserAccount userAccount;@Column(nullable=false)private String fullName;private String email;private String phone;private String address;private LocalDate dateOfBirth;@ManyToOne(optional=false)private Department department;@ManyToOne(optional=false)private Designation designation;private LocalDate joiningDate;@Enumerated(EnumType.STRING)private Status employmentStatus=Status.ACTIVE;private String photoPath;}
