package com.inspection.repository;

import com.inspection.model.Inspection;
import com.inspection.model.InspectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    List<Inspection> findByStatus(InspectionStatus status);
    long countByStatus(InspectionStatus status);
}
