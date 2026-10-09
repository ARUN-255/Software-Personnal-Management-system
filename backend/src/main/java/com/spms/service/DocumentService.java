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
    private final FileStorageService storage;
    @Value("${app.upload-dir}")String dir;
    public List<EmployeeDocument> list(UUID id) {
        return repo.findByEmployeeIdOrderByCreatedAtDesc(id);
    }
    public EmployeeDocument upload(UUID id, String type, String title, String issuer, LocalDate issueDate, MultipartFile file, String actor)throws Exception {
        if(file.isEmpty()||file.getSize()>5*1024*1024)throw new IllegalArgumentException("File must be between 1 byte and 5 MB");
        var mime=Optional.ofNullable(file.getContentType()).orElse("");
        if(!List.of("image/jpeg", "image/png", "application/pdf").contains(mime))throw new IllegalArgumentException("Only JPG, PNG and PDF are allowed");
        byte[] bytes = file.getBytes();
        boolean valid = switch (mime) {
            case "image/png" -> bytes.length > 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G';
            case "image/jpeg" -> bytes.length > 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff;
            case "application/pdf" -> bytes.length > 5 && new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-");
            default -> false;
        };
        if (!valid) throw new IllegalArgumentException("File contents do not match the selected file type");
        var employee = employees.findById(id).orElseThrow();
        var documentType = EmployeeDocument.Type.valueOf(type);
        if (documentType == EmployeeDocument.Type.PHOTO && !mime.startsWith("image/"))
            throw new IllegalArgumentException("Profile photos must be JPG or PNG");
        var key = storage.save(UUID.randomUUID().toString(), bytes, mime);
        var d=new EmployeeDocument();
        d.setEmployee(employee);
        d.setDocumentType(documentType);
        d.setTitle(title);
        d.setIssuer(issuer);
        d.setIssueDate(issueDate);
        d.setObjectKey(key);
        d.setOriginalName(Optional.ofNullable(file.getOriginalFilename()).orElse("document").replaceAll("[^a-zA-Z0-9._ -]", "_"));
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
        return storage.read(d.getObjectKey());
    }
}
