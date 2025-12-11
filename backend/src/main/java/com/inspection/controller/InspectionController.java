package com.inspection.controller;

import com.inspection.model.Checklist;
import com.inspection.model.Inspection;
import com.inspection.model.InspectionStatus;
import com.inspection.model.User;
import com.inspection.repository.ChecklistRepository;
import com.inspection.repository.InspectionRepository;
import com.inspection.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "*")
public class InspectionController {
    
    private final InspectionRepository inspectionRepository;
    private final UserRepository userRepository;
    private final ChecklistRepository checklistRepository;
    
    public InspectionController(InspectionRepository inspectionRepository, UserRepository userRepository, ChecklistRepository checklistRepository) {
        this.inspectionRepository = inspectionRepository;
        this.userRepository = userRepository;
        this.checklistRepository = checklistRepository;
    }
    
    @GetMapping
    public List<Inspection> getAllInspections() {
        return inspectionRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Inspection> getInspectionById(@PathVariable Long id) {
        return inspectionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    public List<Inspection> getInspectionsByStatus(@PathVariable InspectionStatus status) {
        return inspectionRepository.findByStatus(status);
    }
    
    @GetMapping("/statistics")
    public Map<String, Long> getStatistics() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("planned", inspectionRepository.countByStatus(InspectionStatus.PLANNED));
        stats.put("inProgress", inspectionRepository.countByStatus(InspectionStatus.IN_PROGRESS));
        stats.put("completed", inspectionRepository.countByStatus(InspectionStatus.COMPLETED));
        stats.put("total", inspectionRepository.count());
        return stats;
    }
    
    @PostMapping
    public ResponseEntity<?> createInspection(@RequestBody Map<String, Object> requestBody) {
        try {
            Long responsibleUserId = Long.valueOf(requestBody.get("responsibleUserId").toString());
            User responsibleUser = userRepository.findById(responsibleUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Inspection inspection = new Inspection();
            inspection.setFacilityName((String) requestBody.get("facilityName"));
            inspection.setInspectionDate(java.time.LocalDate.parse((String) requestBody.get("inspectionDate")));
            inspection.setResponsibleUser(responsibleUser);
            inspection.setStatus(InspectionStatus.PLANNED);
            
            // Handle checklist if provided
            if (requestBody.containsKey("checklistId") && requestBody.get("checklistId") != null) {
                Long checklistId = Long.valueOf(requestBody.get("checklistId").toString());
                Checklist checklist = checklistRepository.findById(checklistId)
                    .orElseThrow(() -> new RuntimeException("Checklist not found"));
                inspection.setChecklist(checklist);
            }
            
            Inspection saved = inspectionRepository.save(inspection);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInspection(@PathVariable Long id, @RequestBody Map<String, Object> requestBody) {
        try {
            return inspectionRepository.findById(id)
                    .map(existing -> {
                        existing.setFacilityName((String) requestBody.get("facilityName"));
                        existing.setInspectionDate(java.time.LocalDate.parse((String) requestBody.get("inspectionDate")));
                        
                        if (requestBody.containsKey("responsibleUserId")) {
                            Long responsibleUserId = Long.valueOf(requestBody.get("responsibleUserId").toString());
                            User responsibleUser = userRepository.findById(responsibleUserId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                            existing.setResponsibleUser(responsibleUser);
                        }
                        
                        // Handle checklist update
                        if (requestBody.containsKey("checklistId")) {
                            if (requestBody.get("checklistId") != null) {
                                Long checklistId = Long.valueOf(requestBody.get("checklistId").toString());
                                Checklist checklist = checklistRepository.findById(checklistId)
                                    .orElseThrow(() -> new RuntimeException("Checklist not found"));
                                existing.setChecklist(checklist);
                            } else {
                                existing.setChecklist(null);
                            }
                        }
                        
                        return ResponseEntity.ok(inspectionRepository.save(existing));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Inspection> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return inspectionRepository.findById(id)
                .map(existing -> {
                    InspectionStatus newStatus = InspectionStatus.valueOf(body.get("status"));
                    existing.setStatus(newStatus);
                    return ResponseEntity.ok(inspectionRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        if (inspectionRepository.existsById(id)) {
            inspectionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
