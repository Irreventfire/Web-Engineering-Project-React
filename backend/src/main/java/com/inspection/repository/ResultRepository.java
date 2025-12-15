package com.inspection.repository;

import com.inspection.model.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByInspectionId(Long inspectionId);
    List<Result> findByChecklistItemId(Long checklistItemId);
}
