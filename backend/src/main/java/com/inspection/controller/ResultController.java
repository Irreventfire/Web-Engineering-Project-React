package com.inspection.controller;

import com.inspection.model.Result;
import com.inspection.model.Inspection;
import com.inspection.repository.ResultRepository;
import com.inspection.repository.InspectionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
@CrossOrigin(origins = "*")
public class ResultController {
    
    private final ResultRepository resultRepository;
    private final InspectionRepository inspectionRepository;
    
    public ResultController(ResultRepository resultRepository, 
                           InspectionRepository inspectionRepository) {
        this.resultRepository = resultRepository;
        this.inspectionRepository = inspectionRepository;
    }
    
    @GetMapping("/inspection/{inspectionId}")
    public List<Result> getResultsByInspection(@PathVariable Long inspectionId) {
        return resultRepository.findByInspectionId(inspectionId);
    }
    
    @PostMapping("/inspection/{inspectionId}")
    public ResponseEntity<Result> createResult(@PathVariable Long inspectionId, @RequestBody Result result) {
        return inspectionRepository.findById(inspectionId)
                .map(inspection -> {
                    result.setInspection(inspection);
                    Result saved = resultRepository.save(result);
                    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Result> updateResult(@PathVariable Long id, @RequestBody Result result) {
        return resultRepository.findById(id)
                .map(existing -> {
                    existing.setStatus(result.getStatus());
                    existing.setComment(result.getComment());
                    existing.setPhotoUrl(result.getPhotoUrl());
                    return ResponseEntity.ok(resultRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResult(@PathVariable Long id) {
        if (resultRepository.existsById(id)) {
            resultRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
