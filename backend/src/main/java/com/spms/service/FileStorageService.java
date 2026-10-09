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
    @Value("${app.storage.provider:local}") private String provider;
    @Value("${app.storage.bucket:}") private String bucket;
    @Value("${app.storage.region:ap-south-1}") private String region;
    @Value("${app.upload-dir:uploads}") private String directory;

    public String save(String key, byte[] bytes, String mime) throws Exception {
        if ("s3".equals(provider)) {
            if (bucket.isBlank()) throw new IllegalArgumentException("Configure AWS_S3_BUCKET first");
            try (var client = S3Client.builder().region(Region.of(region)).build()) {
                client.putObject(PutObjectRequest.builder().bucket(bucket).key("personnel/" + key)
                        .contentType(mime).serverSideEncryption(ServerSideEncryption.AES256).build(),
                        RequestBody.fromBytes(bytes));
            }
            return "s3:" + bucket + ":personnel/" + key;
        }
        if (!"local".equals(provider)) throw new IllegalArgumentException("Storage provider must be local or s3");
        Path base = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(base);
        Files.write(base.resolve(key), bytes, StandardOpenOption.CREATE_NEW);
        return key;
    }

    public Resource read(String key) {
        if (key.startsWith("s3:")) {
            String[] parts = key.split(":", 3);
            try (var client = S3Client.builder().region(Region.of(region)).build()) {
                return new ByteArrayResource(client.getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(parts[1]).key(parts[2]).build()).asByteArray());
            }
        }
        Path base = Path.of(directory).toAbsolutePath().normalize();
        Path file = base.resolve(key).normalize();
        if (!file.startsWith(base)) throw new IllegalArgumentException("Invalid file path");
        return new FileSystemResource(file);
    }
}
