package com.inspection.controller;

import com.inspection.model.User;
import com.inspection.model.UserRole;
import com.inspection.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Test
    void getAllUsers_shouldReturnAllUsers() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].username").exists());
    }

    @Test
    void adminCannotChangeOwnRole() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        
        mockMvc.perform(put("/api/users/" + admin.getId() + "/role")
                .header("X-User-Id", admin.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"USER\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You cannot change your own role"));
    }

    @Test
    void adminCannotDisableOwnAccount() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        
        mockMvc.perform(put("/api/users/" + admin.getId() + "/enabled")
                .header("X-User-Id", admin.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You cannot disable your own account"));
    }

    @Test
    void adminCannotDeleteOwnAccount() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        
        mockMvc.perform(delete("/api/users/" + admin.getId())
                .header("X-User-Id", admin.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You cannot delete your own account"));
    }

    @Test
    void adminCanChangeOtherUserRole() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        User user = userRepository.findByUsername("user").orElseThrow();
        
        mockMvc.perform(put("/api/users/" + user.getId() + "/role")
                .header("X-User-Id", admin.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"VIEWER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("VIEWER"));
        
        // Restore original role
        mockMvc.perform(put("/api/users/" + user.getId() + "/role")
                .header("X-User-Id", admin.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"USER\"}"));
    }

    @Test
    void adminCanDisableOtherUser() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        User user = userRepository.findByUsername("user").orElseThrow();
        
        mockMvc.perform(put("/api/users/" + user.getId() + "/enabled")
                .header("X-User-Id", admin.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        
        // Restore user state
        mockMvc.perform(put("/api/users/" + user.getId() + "/enabled")
                .header("X-User-Id", admin.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true}"));
    }
}
