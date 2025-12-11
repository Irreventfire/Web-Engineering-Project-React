package com.inspection.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inspections")
public class Inspection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String facilityName;
    
    @Column(nullable = false)
    private LocalDate inspectionDate;
    
    @ManyToOne
    @JoinColumn(name = "responsible_user_id", nullable = false)
    private User responsibleUser;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InspectionStatus status = InspectionStatus.PLANNED;
    
    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Result> results = new ArrayList<>();
    
    @ManyToOne
    @JoinColumn(name = "checklist_id")
    private Checklist checklist;
    
    // Constructors
    public Inspection() {}
    
    public Inspection(String facilityName, LocalDate inspectionDate, User responsibleUser) {
        this.facilityName = facilityName;
        this.inspectionDate = inspectionDate;
        this.responsibleUser = responsibleUser;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }
    
    public LocalDate getInspectionDate() { return inspectionDate; }
    public void setInspectionDate(LocalDate inspectionDate) { this.inspectionDate = inspectionDate; }
    
    public User getResponsibleUser() { return responsibleUser; }
    public void setResponsibleUser(User responsibleUser) { this.responsibleUser = responsibleUser; }
    
    public InspectionStatus getStatus() { return status; }
    public void setStatus(InspectionStatus status) { this.status = status; }
    
    public List<Result> getResults() { return results; }
    public void setResults(List<Result> results) { this.results = results; }
    
    public Checklist getChecklist() { return checklist; }
    public void setChecklist(Checklist checklist) { this.checklist = checklist; }
}
