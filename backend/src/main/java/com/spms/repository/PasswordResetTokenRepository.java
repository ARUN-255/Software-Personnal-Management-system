package com.spms.repository;

import com.spms.entity.PasswordResetToken;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    List<PasswordResetToken> findTop5ByUserUsernameAndUsedFalseOrderByCreatedAtDesc(String username);
}
