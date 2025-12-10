package com.inspection.controller;

import com.inspection.model.User;
import com.inspection.model.UserRole;
import com.inspection.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(toUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> userData) {
        String username = userData.get("username");
        String name = userData.get("name");
        String password = userData.get("password");
        String email = userData.get("email");
        String roleStr = userData.get("role");
        
        if (username == null || name == null || password == null || email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username, name, password and email are required"));
        }
        
        // Validate password length (minimum 6 characters for demo purposes)
        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }
        
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }
        
        UserRole role = UserRole.USER;
        if (roleStr != null) {
            try {
                role = UserRole.valueOf(roleStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
            }
        }
        
        // Hash the password before saving
        String hashedPassword = passwordEncoder.encode(password);
        User newUser = new User(username, name, hashedPassword, email, role);
        User savedUser = userRepository.save(newUser);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(toUserResponse(savedUser));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> userData) {
        
        return userRepository.findById(id)
                .map(user -> {
                    String username = userData.get("username");
                    String name = userData.get("name");
                    String email = userData.get("email");
                    
                    // Check if username is being changed and if it already exists
                    if (username != null && !username.equals(user.getUsername())) {
                        if (userRepository.existsByUsername(username)) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
                        }
                        user.setUsername(username);
                    }
                    
                    // Check if email is being changed and if it already exists
                    if (email != null && !email.equals(user.getEmail())) {
                        if (userRepository.existsByEmail(email)) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
                        }
                        user.setEmail(email);
                    }
                    
                    if (name != null) {
                        user.setName(name);
                    }
                    
                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(toUserResponse(updatedUser));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        
        String newRole = body.get("role");
        if (newRole == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }
        
        // Prevent admin from modifying their own role
        if (currentUserId != null && currentUserId.equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot change your own role"));
        }
        
        UserRole role;
        try {
            role = UserRole.valueOf(newRole);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }
        
        return userRepository.findById(id)
                .map(user -> {
                    user.setRole(role);
                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(toUserResponse(updatedUser));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/enabled")
    public ResponseEntity<?> updateUserEnabled(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        
        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Enabled status is required"));
        }
        
        // Prevent admin from disabling themselves
        if (currentUserId != null && currentUserId.equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot disable your own account"));
        }
        
        return userRepository.findById(id)
                .map(user -> {
                    user.setEnabled(enabled);
                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(toUserResponse(updatedUser));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        
        // Prevent admin from deleting themselves
        if (currentUserId != null && currentUserId.equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot delete your own account"));
        }
        
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    private Map<String, Object> toUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        response.put("enabled", user.isEnabled());
        return response;
    }
}
