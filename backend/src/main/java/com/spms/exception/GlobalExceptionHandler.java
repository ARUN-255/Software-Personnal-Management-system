package com.spms.exception;
import org.springframework.http.*;import org.springframework.web.bind.MethodArgumentNotValidException;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestControllerAdvice public class GlobalExceptionHandler{
 @ExceptionHandler({IllegalArgumentException.class,NoSuchElementException.class})ResponseEntity<?> bad(RuntimeException e){return ResponseEntity.badRequest().body(Map.of("message",message(e)));}
 @ExceptionHandler(MethodArgumentNotValidException.class)ResponseEntity<?> validation(MethodArgumentNotValidException e){return ResponseEntity.badRequest().body(Map.of("message",e.getBindingResult().getFieldErrors().stream().map(x->x.getField()+" "+x.getDefaultMessage()).toList()));}
 @ExceptionHandler(Exception.class)ResponseEntity<?> error(Exception e){e.printStackTrace();return ResponseEntity.status(500).body(Map.of("message",message(e)));}
 private String message(Throwable e){Throwable root=e;while(root.getCause()!=null)root=root.getCause();return root.getMessage()==null?e.getClass().getSimpleName():root.getMessage();}
}
