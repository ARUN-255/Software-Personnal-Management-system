package com.spms.exception;

import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.dao.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private String message(String english, String language) {
        if (!"ta".equalsIgnoreCase(language)) return english;
        return switch (english) {
            case "Invalid credentials" -> "பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது";
            case "Record not found" -> "பதிவு கிடைக்கவில்லை";
            case "Access denied" -> "அணுகல் மறுக்கப்பட்டது";
            case "The reset code is invalid or expired" -> "மீட்டமைப்புக் குறியீடு தவறானது அல்லது காலாவதியானது";
            default -> english;
        };
    }
    @ExceptionHandler({IllegalArgumentException.class, java.time.format.DateTimeParseException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> bad(Exception error, @RequestHeader(value="X-App-Language", defaultValue="en") String language) {
        String text = Objects.toString(error.getMessage(), "Invalid request");
        return ResponseEntity.badRequest().body(Map.of("message", message(text, language)));
    }
    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> missing(@RequestHeader(value="X-App-Language", defaultValue="en") String language) { return ResponseEntity.status(404).body(Map.of("message", message("Record not found", language))); }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<?> credentials(@RequestHeader(value="X-App-Language", defaultValue="en") String language) { return ResponseEntity.status(401).body(Map.of("message", message("Invalid credentials", language))); }
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    ResponseEntity<?> denied(@RequestHeader(value="X-App-Language", defaultValue="en") String language) { return ResponseEntity.status(403).body(Map.of("message", message("Access denied", language))); }
    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class})
    ResponseEntity<?> conflict() { return ResponseEntity.status(409).body(Map.of("message", "This record changed or already exists. Refresh and try again.")); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException error) {
        return ResponseEntity.badRequest().body(Map.of("message", error.getBindingResult().getFieldErrors().stream()
                .map(field -> field.getField() + " " + field.getDefaultMessage()).reduce((a, b) -> a + "; " + b).orElse("Invalid input")));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> error(Exception error) {
        org.slf4j.LoggerFactory.getLogger(getClass()).error("Request failed: {}", error.getClass().getSimpleName());
        return ResponseEntity.status(500).body(Map.of("message", "The operation could not be completed. Check the backend configuration and try again."));
    }
}
