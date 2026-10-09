package com.spms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration @RequiredArgsConstructor
public class LegacyAttendanceMigration {
    private final JdbcTemplate jdbc;
    // Hibernate adds the nullable version column to existing installations. Initialize legacy rows.
    @Bean CommandLineRunner attendanceVersions() {
        return args -> jdbc.update("update attendance_record set version = 0 where version is null");
    }
}
