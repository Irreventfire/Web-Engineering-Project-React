package com.inspection.controller;

import com.inspection.model.User;
import com.inspection.model.UserRole;
import com.inspection.repository.UserRepository;
import org.springframework.http.ResponseEntity;
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
    
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        response.put("enabled", user.isEnabled());
        return response;
    }
}
