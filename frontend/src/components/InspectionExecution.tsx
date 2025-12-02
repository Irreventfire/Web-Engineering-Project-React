import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspection, getChecklistItems, getResultsByInspection, createResult, updateResult, updateInspectionStatus } from '../services/api';
import { Inspection, ChecklistItem, Result, ResultStatus, InspectionStatus } from '../types';

const InspectionExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [results, setResults] = useState<Map<number, Result>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  const fetchData = async (inspectionId: number) => {
    try {
      const inspectionRes = await getInspection(inspectionId);
      setInspection(inspectionRes.data);

      // Ensure inspection is in progress
      if (inspectionRes.data.status === InspectionStatus.PLANNED) {
        await updateInspectionStatus(inspectionId, InspectionStatus.IN_PROGRESS);
        setInspection({ ...inspectionRes.data, status: InspectionStatus.IN_PROGRESS });
      }

      // Fetch checklist items
      if (inspectionRes.data.checklist) {
        const itemsRes = await getChecklistItems(inspectionRes.data.checklist.id);
        setChecklistItems(itemsRes.data);
      }

      // Fetch existing results
      const resultsRes = await getResultsByInspection(inspectionId);
      const resultsMap = new Map<number, Result>();
      resultsRes.data.forEach(result => {
        if (result.checklistItem) {
          resultsMap.set(result.checklistItem.id, result);
        }
      });
      setResults(resultsMap);
    } catch (error) {
      console.error('Error fetching inspection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (item: ChecklistItem, status: ResultStatus) => {
    if (!id) return;

    const existingResult = results.get(item.id);
    
    try {
      if (existingResult?.id) {
        // Update existing result
        const updatedResult = await updateResult(existingResult.id, {
          ...existingResult,
          status
        });
        setResults(new Map(results.set(item.id, updatedResult.data)));
      } else {
        // Create new result
        const newResult = await createResult(parseInt(id), {
          checklistItem: item,
          status,
          comment: ''
        });
        setResults(new Map(results.set(item.id, newResult.data)));
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const handleCommentChange = (item: ChecklistItem, comment: string) => {
    const existingResult = results.get(item.id);
    if (existingResult) {
      setResults(new Map(results.set(item.id, { ...existingResult, comment })));
    }
  };

  const handleCommentBlur = async (item: ChecklistItem) => {
    const result = results.get(item.id);
    if (result?.id) {
      try {
        await updateResult(result.id, result);
      } catch (error) {
        console.error('Error saving comment:', error);
      }
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    
    // Check if all items have results
    const allCompleted = checklistItems.every(item => results.has(item.id));
    
    if (!allCompleted) {
      if (!window.confirm('Not all items have been completed. Do you want to finish anyway?')) {
        return;
      }
    }

    setSaving(true);
    try {
      await updateInspectionStatus(parseInt(id), InspectionStatus.COMPLETED);
      navigate(`/inspections/${id}/report`);
    } catch (error) {
      console.error('Error completing inspection:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading inspection...</div>;
  }

  if (!inspection) {
    return <div className="empty-state">Inspection not found</div>;
  }

  if (!inspection.checklist) {
    return (
      <div className="empty-state">
        <h3>No checklist assigned</h3>
        <p>Please assign a checklist to this inspection before starting.</p>
        <button className="btn btn-primary" onClick={() => navigate(`/inspections/${id}/edit`)}>
          Edit Inspection
        </button>
      </div>
    );
  }

  return (
    <div className="inspection-execution">
      <div className="inspection-header">
        <h2>{inspection.facilityName}</h2>
        <div className="inspection-meta">
          <span>Date: {new Date(inspection.inspectionDate).toLocaleDateString()}</span>
          <span>Employee: {inspection.responsibleEmployee}</span>
          <span>Checklist: {inspection.checklist.name}</span>
        </div>
      </div>

      <h3>Checklist Items</h3>

      {checklistItems.length === 0 ? (
        <div className="empty-state">
          <p>No items in this checklist.</p>
        </div>
      ) : (
        <>
          {checklistItems.map((item, index) => {
            const result = results.get(item.id);
            return (
              <div key={item.id} className="result-item">
                <h4>{index + 1}. {item.description}</h4>
                
                <div className="result-options">
                  <button
                    className={`result-option ${result?.status === ResultStatus.FULFILLED ? 'selected fulfilled' : ''}`}
                    onClick={() => handleStatusChange(item, ResultStatus.FULFILLED)}
                  >
                    ✓ Fulfilled
                  </button>
                  <button
                    className={`result-option ${result?.status === ResultStatus.NOT_FULFILLED ? 'selected not-fulfilled' : ''}`}
                    onClick={() => handleStatusChange(item, ResultStatus.NOT_FULFILLED)}
                  >
                    ✗ Not Fulfilled
                  </button>
                  <button
                    className={`result-option ${result?.status === ResultStatus.NOT_APPLICABLE ? 'selected not-applicable' : ''}`}
                    onClick={() => handleStatusChange(item, ResultStatus.NOT_APPLICABLE)}
                  >
                    — N/A
                  </button>
                </div>

                <textarea
                  className="comment-input"
                  placeholder="Add a comment..."
                  value={result?.comment || ''}
                  onChange={(e) => handleCommentChange(item, e.target.value)}
                  onBlur={() => handleCommentBlur(item)}
                />
              </div>
            );
          })}

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/inspections')}
            >
              Save & Exit
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? 'Completing...' : 'Complete Inspection'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InspectionExecution;
