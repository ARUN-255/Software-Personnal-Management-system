package com.spms.service;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.spms.entity.*;
import com.spms.repository.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
@Service @RequiredArgsConstructor public class DocumentService {
    private final EmployeeDocumentRepository repo;
    private final EmployeeRepository employees;
    private final UserAccountRepository users;
    @Value("${app.upload-dir}")String dir;
    public List<EmployeeDocument> list(UUID id) {
        return repo.findByEmployeeIdOrderByCreatedAtDesc(id);
    }
    public EmployeeDocument upload(UUID id, String type, String title, String issuer, LocalDate issueDate, MultipartFile file, String actor)throws Exception {
        if(file.isEmpty()||file.getSize()>5*1024*1024)throw new IllegalArgumentException("File must be between 1 byte and 5 MB");
        var mime=Optional.ofNullable(file.getContentType()).orElse("");
        if(!List.of("image/jpeg", "image/png", "application/pdf").contains(mime))throw new IllegalArgumentException("Only JPG, PNG and PDF are allowed");
        var key=UUID.randomUUID()+"-"+file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
        var base=Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(base);
        Files.copy(file.getInputStream(), base.resolve(key), StandardCopyOption.REPLACE_EXISTING);
        var d=new EmployeeDocument();
        d.setEmployee(employees.findById(id).orElseThrow());
        d.setDocumentType(EmployeeDocument.Type.valueOf(type));
        d.setTitle(title);
        d.setIssuer(issuer);
        d.setIssueDate(issueDate);
        d.setObjectKey(key);
        d.setOriginalName(file.getOriginalFilename());
        d.setMimeType(mime);
        d.setSizeBytes(file.getSize());
        d.setUploadedBy(users.findByUsername(actor).orElseThrow());
        var saved=repo.save(d);
        if(saved.getDocumentType()==EmployeeDocument.Type.PHOTO) {
            saved.getEmployee().setPhotoPath(saved.getId().toString());
            employees.save(saved.getEmployee());
        }
        return saved;
    }
    public EmployeeDocument get(UUID id) {
        return repo.findById(id).orElseThrow();
    }
    public Resource resource(EmployeeDocument d) {
        return new FileSystemResource(Paths.get(dir).toAbsolutePath().normalize().resolve(d.getObjectKey()));
    }
}
