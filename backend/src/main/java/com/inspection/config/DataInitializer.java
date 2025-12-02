package com.inspection.config;

import com.inspection.model.*;
import com.inspection.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {
    
    private final InspectionRepository inspectionRepository;
    private final ChecklistRepository checklistRepository;
    
    public DataInitializer(InspectionRepository inspectionRepository,
                          ChecklistRepository checklistRepository) {
        this.inspectionRepository = inspectionRepository;
        this.checklistRepository = checklistRepository;
    }
    
    @Override
    public void run(String... args) {
        // Create sample checklists
        Checklist safetyChecklist = new Checklist("Safety Inspection Checklist", "Standard safety inspection for industrial facilities");
        safetyChecklist.addItem(new ChecklistItem("Fire extinguisher present and accessible", 1));
        safetyChecklist.addItem(new ChecklistItem("Emergency exits clearly marked", 2));
        safetyChecklist.addItem(new ChecklistItem("Safety equipment available", 3));
        safetyChecklist.addItem(new ChecklistItem("First aid kit stocked", 4));
        safetyChecklist.addItem(new ChecklistItem("Safety signs visible", 5));
        checklistRepository.save(safetyChecklist);
        
        Checklist maintenanceChecklist = new Checklist("Maintenance Checklist", "Regular maintenance inspection checklist");
        maintenanceChecklist.addItem(new ChecklistItem("Machine lubrication level checked", 1));
        maintenanceChecklist.addItem(new ChecklistItem("Belts and hoses inspected", 2));
        maintenanceChecklist.addItem(new ChecklistItem("Electrical connections verified", 3));
        maintenanceChecklist.addItem(new ChecklistItem("Filters cleaned or replaced", 4));
        checklistRepository.save(maintenanceChecklist);
        
        // Create sample inspections
        Inspection inspection1 = new Inspection("Plant A - Main Hall", LocalDate.now().plusDays(3), "John Smith");
        inspection1.setChecklist(safetyChecklist);
        inspection1.setStatus(InspectionStatus.PLANNED);
        inspectionRepository.save(inspection1);
        
        Inspection inspection2 = new Inspection("Plant B - Assembly Line", LocalDate.now(), "Jane Doe");
        inspection2.setChecklist(maintenanceChecklist);
        inspection2.setStatus(InspectionStatus.IN_PROGRESS);
        inspectionRepository.save(inspection2);
        
        Inspection inspection3 = new Inspection("Warehouse C - Storage Area", LocalDate.now().minusDays(5), "Bob Johnson");
        inspection3.setChecklist(safetyChecklist);
        inspection3.setStatus(InspectionStatus.COMPLETED);
        inspectionRepository.save(inspection3);
        
        Inspection inspection4 = new Inspection("Plant A - Control Room", LocalDate.now().plusDays(7), "Alice Brown");
        inspection4.setChecklist(maintenanceChecklist);
        inspection4.setStatus(InspectionStatus.PLANNED);
        inspectionRepository.save(inspection4);
    }
}
