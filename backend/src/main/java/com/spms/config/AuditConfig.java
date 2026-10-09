package com.spms.config;

import com.spms.entity.AuditEvent;
import com.spms.repository.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;

@Configuration @RequiredArgsConstructor
public class AuditConfig implements WebMvcConfigurer {
    private final AuditEventRepository audit;
    private final UserAccountRepository users;

    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                    Object handler, Exception exception) {
                if (request.getUserPrincipal() == null || response.getStatus() >= 400
                        || !java.util.Set.of("POST", "PUT", "PATCH", "DELETE").contains(request.getMethod())) return;
                var event = new AuditEvent();
                users.findByUsername(request.getUserPrincipal().getName()).ifPresent(event::setActor);
                event.setAction(request.getMethod());
                event.setTargetType("HTTP_ENDPOINT");
                event.setTargetId(request.getRequestURI());
                event.setChangeSummary("Successful operation; request contents and credentials are not recorded.");
                audit.save(event);
            }
        }).addPathPatterns("/api/**").excludePathPatterns("/api/workspace/assistant", "/api/auth/login");
    }
}
