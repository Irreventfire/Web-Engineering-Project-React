package com.inspection.controller;

import com.inspection.model.Inspection;
import com.inspection.model.InspectionStatus;
import com.inspection.repository.InspectionRepository;
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
    
    public InspectionController(InspectionRepository inspectionRepository) {
        this.inspectionRepository = inspectionRepository;
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
    public ResponseEntity<Inspection> createInspection(@RequestBody Inspection inspection) {
        inspection.setStatus(InspectionStatus.PLANNED);
        Inspection saved = inspectionRepository.save(inspection);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Inspection> updateInspection(@PathVariable Long id, @RequestBody Inspection inspection) {
        return inspectionRepository.findById(id)
                .map(existing -> {
                    existing.setFacilityName(inspection.getFacilityName());
                    existing.setInspectionDate(inspection.getInspectionDate());
                    existing.setResponsibleEmployee(inspection.getResponsibleEmployee());
                    existing.setChecklist(inspection.getChecklist());
                    return ResponseEntity.ok(inspectionRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
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
