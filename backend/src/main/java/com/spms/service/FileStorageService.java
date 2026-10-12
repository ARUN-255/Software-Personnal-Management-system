package com.spms.service;

import java.nio.file.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

@Service
public class FileStorageService {
    @Value("${app.upload-dir:uploads}")
    private String directory;

    @Value("${app.storage.provider:local}")
    private String provider;

    @Value("${app.storage.bucket:}")
    private String bucket;

    @Value("${app.storage.region:ap-south-1}")
    private String region;

    private volatile S3Client s3Client;

    public String save(String key, byte[] bytes, String mime) throws Exception {
        validateKey(key);
        if (usesS3()) {
            requireBucket();
            s3().putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(mime)
                    .build(),
                RequestBody.fromBytes(bytes)
            );
            return key;
        }

        Path base = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(base);
        Files.write(base.resolve(key), bytes, StandardOpenOption.CREATE_NEW);
        return key;
    }

    public Resource read(String key) {
        validateKey(key);
        if (usesS3()) {
            requireBucket();
            try {
                byte[] bytes = s3().getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(key).build()
                ).asByteArray();
                return new ByteArrayResource(bytes) {
                    @Override
                    public String getFilename() {
                        return key;
                    }
                };
            } catch (S3Exception exception) {
                throw new IllegalArgumentException("Stored file was not found", exception);
            }
        }

        Path base = Path.of(directory).toAbsolutePath().normalize();
        Path file = base.resolve(key).normalize();
        if (!file.startsWith(base)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        return new FileSystemResource(file);
    }

    private boolean usesS3() {
        return "s3".equalsIgnoreCase(provider);
    }

    private void requireBucket() {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("AWS_S3_BUCKET is required when STORAGE_PROVIDER=s3");
        }
    }

    private void validateKey(String key) {
        if (key == null || key.isBlank() || key.contains("..") || key.startsWith("/")) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    private S3Client s3() {
        if (s3Client == null) {
            synchronized (this) {
                if (s3Client == null) {
                    s3Client = S3Client.builder().region(Region.of(region)).build();
                }
            }
        }
        return s3Client;
    }
}
