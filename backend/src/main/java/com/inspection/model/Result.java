package com.inspection.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "results")
public class Result {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "inspection_id")
    @JsonIgnore
    private Inspection inspection;
    
    @ManyToOne
    @JoinColumn(name = "checklist_item_id", nullable = true)
    private ChecklistItem checklistItem;
    
    @Enumerated(EnumType.STRING)
    private ResultStatus status;
    
    @Column(length = 1000)
    private String comment;
    
    @Column(length = 500)
    private String photoUrl;
    
    // Constructors
    public Result() {}
    
    public Result(ChecklistItem checklistItem, ResultStatus status) {
        this.checklistItem = checklistItem;
        this.status = status;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Inspection getInspection() { return inspection; }
    public void setInspection(Inspection inspection) { this.inspection = inspection; }
    
    public ChecklistItem getChecklistItem() { return checklistItem; }
    public void setChecklistItem(ChecklistItem checklistItem) { this.checklistItem = checklistItem; }
    
    public ResultStatus getStatus() { return status; }
    public void setStatus(ResultStatus status) { this.status = status; }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
