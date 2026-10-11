package com.spms.service;

import java.nio.file.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.stereotype.Service;

@Service
public class FileStorageService {
    @Value("${app.upload-dir:uploads}") private String directory;

    public String save(String key, byte[] bytes, String mime) throws Exception {
        Path base = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(base);
        Files.write(base.resolve(key), bytes, StandardOpenOption.CREATE_NEW);
        return key;
    }

    public Resource read(String key) {
        Path base = Path.of(directory).toAbsolutePath().normalize();
        Path file = base.resolve(key).normalize();
        if (!file.startsWith(base)) throw new IllegalArgumentException("Invalid file path");
        return new FileSystemResource(file);
    }
}
