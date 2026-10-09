package com.spms.config;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import java.util.*;
import com.spms.repository.UserAccountRepository;
@Configuration @RequiredArgsConstructor public class SecurityConfig {
    private final UserAccountRepository users;
    @Value("${app.frontend-url}")String frontend;
    @Bean PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration c)throws Exception {
        return c.getAuthenticationManager();
    }
    @Bean UserDetailsService userDetailsService() {
        return username-> {
            var u=users.findByUsername(username).orElseThrow(()->new UsernameNotFoundException("Invalid credentials"));
            return User.withUsername(u.getUsername()).password(u.getPasswordHash()).roles(u.getRole().name()).disabled(!u.isEnabled()).build();
        }
        ;
    }
    @Bean SecurityFilterChain chain(HttpSecurity h)throws Exception {
        var source=new UrlBasedCorsConfigurationSource();
        var c=new CorsConfiguration();
        c.setAllowedOrigins(List.of(frontend));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        source.registerCorsConfiguration("/**", c);
        h.cors(x->x.configurationSource(source)).csrf(x->x.csrfTokenRepository(new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository()).csrfTokenRequestHandler(new org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler())).authorizeHttpRequests(a->a.requestMatchers("/api/auth/login", "/api/admin-access-requests", "/api/auth/csrf", "/error").permitAll().requestMatchers("/api/owner/**").hasRole("OWNER").requestMatchers("/api/admin/**").hasRole("ADMIN").requestMatchers("/api/me/**").hasRole("EMPLOYEE").requestMatchers("/api/workspace/**").hasAnyRole("ADMIN", "EMPLOYEE").anyRequest().authenticated()).exceptionHandling(e->e.authenticationEntryPoint((q,r,x)->r.sendError(401)).accessDeniedHandler((q,r,x)->r.sendError(403))).formLogin(x->x.disable()).logout(x->x.disable());
        h.addFilterAfter(new ActiveAccountFilter(users), org.springframework.security.web.authentication.AnonymousAuthenticationFilter.class);
        return h.build();
    }
}
