package com.inspection.config;

import com.inspection.model.*;
import com.inspection.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {
    
    private final InspectionRepository inspectionRepository;
    private final ChecklistRepository checklistRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public DataInitializer(InspectionRepository inspectionRepository,
                          ChecklistRepository checklistRepository,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.inspectionRepository = inspectionRepository;
        this.checklistRepository = checklistRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public void run(String... args) {
        // Create default admin user if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", "Admin User", passwordEncoder.encode("admin123"), "admin@example.com", UserRole.ADMIN);
            userRepository.save(admin);
        }
        
        // Create default user if not exists
        if (!userRepository.existsByUsername("user")) {
            User user = new User("user", "Regular User", passwordEncoder.encode("user123"), "user@example.com", UserRole.USER);
            userRepository.save(user);
        }
        
        // Create default viewer if not exists
        if (!userRepository.existsByUsername("viewer")) {
            User viewer = new User("viewer", "View Only User", passwordEncoder.encode("viewer123"), "viewer@example.com", UserRole.VIEWER);
            userRepository.save(viewer);
        }
    }
}
