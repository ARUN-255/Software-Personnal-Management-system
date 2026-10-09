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
    @ExceptionHandler({IllegalArgumentException.class, java.time.format.DateTimeParseException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> bad(Exception error) {
        return ResponseEntity.badRequest().body(Map.of("message", Objects.toString(error.getMessage(), "Invalid request")));
    }
    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> missing() { return ResponseEntity.status(404).body(Map.of("message", "Record not found")); }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<?> credentials() { return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")); }
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    ResponseEntity<?> denied() { return ResponseEntity.status(403).body(Map.of("message", "Access denied")); }
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
