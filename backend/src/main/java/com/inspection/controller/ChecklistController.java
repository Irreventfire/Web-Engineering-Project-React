package com.inspection.controller;

import com.inspection.model.Checklist;
import com.inspection.model.ChecklistItem;
import com.inspection.model.Result;
import com.inspection.repository.ChecklistRepository;
import com.inspection.repository.ChecklistItemRepository;
import com.inspection.repository.ResultRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checklists")
@CrossOrigin(origins = "*")
public class ChecklistController {
    
    private final ChecklistRepository checklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ResultRepository resultRepository;
    
    public ChecklistController(ChecklistRepository checklistRepository, 
                               ChecklistItemRepository checklistItemRepository,
                               ResultRepository resultRepository) {
        this.checklistRepository = checklistRepository;
        this.checklistItemRepository = checklistItemRepository;
        this.resultRepository = resultRepository;
    }
    
    @GetMapping
    public List<Checklist> getAllChecklists() {
        return checklistRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Checklist> getChecklistById(@PathVariable Long id) {
        return checklistRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{id}/items")
    public List<ChecklistItem> getChecklistItems(@PathVariable Long id) {
        return checklistItemRepository.findByChecklistIdOrderByOrderIndexAsc(id);
    }
    
    @PostMapping
    public ResponseEntity<Checklist> createChecklist(@RequestBody Checklist checklist) {
        // Handle items if they exist
        if (checklist.getItems() != null) {
            for (ChecklistItem item : checklist.getItems()) {
                item.setChecklist(checklist);
            }
        }
        Checklist saved = checklistRepository.save(checklist);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PostMapping("/{id}/items")
    public ResponseEntity<ChecklistItem> addItem(@PathVariable Long id, @RequestBody ChecklistItem item) {
        return checklistRepository.findById(id)
                .map(checklist -> {
                    item.setChecklist(checklist);
                    ChecklistItem saved = checklistItemRepository.save(item);
                    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Checklist> updateChecklist(@PathVariable Long id, @RequestBody Checklist checklist) {
        return checklistRepository.findById(id)
                .map(existing -> {
                    existing.setName(checklist.getName());
                    existing.setDescription(checklist.getDescription());
                    return ResponseEntity.ok(checklistRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChecklist(@PathVariable Long id) {
        if (checklistRepository.existsById(id)) {
            checklistRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteChecklistItem(@PathVariable Long itemId) {
        if (!checklistItemRepository.existsById(itemId)) {
            return ResponseEntity.notFound().build();
        }
        
        // Before deleting the item, nullify the reference in any results that point to it
        // This preserves inspection results while allowing the checklist item to be deleted
        List<Result> relatedResults = resultRepository.findByChecklistItemId(itemId);
        for (Result result : relatedResults) {
            result.setChecklistItem(null);
            resultRepository.save(result);
        }
        
        checklistItemRepository.deleteById(itemId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ChecklistItem> updateChecklistItem(@PathVariable Long itemId, @RequestBody ChecklistItem item) {
        return checklistItemRepository.findById(itemId)
                .map(existing -> {
                    if (item.getDescription() != null) {
                        existing.setDescription(item.getDescription());
                    }
                    if (item.getDesiredPhotoUrl() != null) {
                        existing.setDesiredPhotoUrl(item.getDesiredPhotoUrl());
                    }
                    return ResponseEntity.ok(checklistItemRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
