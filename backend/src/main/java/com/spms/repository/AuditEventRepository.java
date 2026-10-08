package com.spms.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.*;
import java.time.*;
import com.spms.entity.*;
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
}
