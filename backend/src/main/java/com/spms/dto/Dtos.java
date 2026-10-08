package com.spms.dto;
import jakarta.validation.constraints.*;
import java.math.*;
import java.time.*;
import java.util.*;
public final class Dtos {
    private Dtos() {
    }
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }
    public record ChangePasswordRequest(@NotBlank String currentPassword, @Size(min=8) String newPassword) {
    }
    public record AccessRequest(@NotBlank String fullName, @Email String email, @NotBlank String reason) {
    }
    public record EmployeeRequest(@NotBlank String employeeCode, @NotBlank String username, @Size(min=8) String temporaryPassword, @NotBlank String fullName, @Email String email, String phone, String address, LocalDate dateOfBirth, @NotNull UUID departmentId, @NotNull UUID designationId, @NotNull LocalDate joiningDate) {
    }
    public record AttendanceRequest(@NotNull LocalDate workDate, @NotBlank String status, String remarks) {
    }
    public record PayrollRequest(@NotNull LocalDate payPeriod, @NotNull @PositiveOrZero BigDecimal basicPay, @NotNull @PositiveOrZero BigDecimal allowances, @NotNull @PositiveOrZero BigDecimal deductions, boolean publish) {
    }
    public record ReferenceRequest(@NotBlank String value) {
    }
}
