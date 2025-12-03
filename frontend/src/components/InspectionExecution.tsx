import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspection, getChecklistItems, getResultsByInspection, createResult, updateResult, updateInspectionStatus, uploadFile } from '../services/api';
import { Inspection, ChecklistItem, Result, ResultStatus, InspectionStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const InspectionExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [results, setResults] = useState<Map<number, Result>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const { t } = useLanguage();

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

  const handlePhotoUpload = async (item: ChecklistItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploading(item.id);
    try {
      const uploadResult = await uploadFile(file);
      const existingResult = results.get(item.id);
      
      if (existingResult?.id) {
        // Update existing result with photo
        const updatedResult = await updateResult(existingResult.id, {
          ...existingResult,
          photoUrl: uploadResult.url
        });
        setResults(new Map(results.set(item.id, updatedResult.data)));
      } else {
        // Create new result with photo
        const newResult = await createResult(parseInt(id), {
          checklistItem: item,
          status: ResultStatus.NOT_APPLICABLE,
          comment: '',
          photoUrl: uploadResult.url
        });
        setResults(new Map(results.set(item.id, newResult.data)));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(null);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    
    // Check if all items have results
    const allCompleted = checklistItems.every(item => results.has(item.id));
    
    if (!allCompleted) {
      if (!window.confirm(t('incompleteConfirm'))) {
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
    return <div className="loading">{t('loadingInspection')}</div>;
  }

  if (!inspection) {
    return <div className="empty-state">{t('inspectionNotFound')}</div>;
  }

  if (!inspection.checklist) {
    return (
      <div className="empty-state">
        <h3>{t('noChecklist')}</h3>
        <p>{t('selectChecklistFirst')}</p>
        <button className="btn btn-primary" onClick={() => navigate(`/inspections/${id}/edit`)}>
          {t('editInspection')}
        </button>
      </div>
    );
  }

  return (
    <div className="inspection-execution">
      <div className="inspection-header">
        <h2>{inspection.facilityName}</h2>
        <div className="inspection-meta">
          <span>{t('date')}: {new Date(inspection.inspectionDate).toLocaleDateString()}</span>
          <span>{t('employee')}: {inspection.responsibleEmployee}</span>
          <span>{t('checklist')}: {inspection.checklist.name}</span>
        </div>
      </div>

      <h3>{t('checklistItems')}</h3>

      {checklistItems.length === 0 ? (
        <div className="empty-state">
          <p>{t('noItemsInChecklist')}</p>
        </div>
      ) : (
        <>
          {checklistItems.map((item, index) => {
            const result = results.get(item.id);
            return (
              <div key={item.id} className="result-item">
                <h4>{index + 1}. {item.description}</h4>
                
                {/* Show desired state photo if available */}
                {item.desiredPhotoUrl && (
                  <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#388e3c' }}>{t('desiredState')}:</span>
                    <img 
                      src={`${API_BASE_URL}${item.desiredPhotoUrl.replace('/api', '')}`}
                      alt={t('desiredState')} 
                      style={{ display: 'block', maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid #dce4ec' }}
                    />
                  </div>
                )}
                
                <div className="result-options">
                  <button
                    className={`result-option ${result?.status === ResultStatus.FULFILLED ? 'selected fulfilled' : ''}`}
                    onClick={() => handleStatusChange(item, ResultStatus.FULFILLED)}
                  >
                    ✓ {t('fulfilled')}
                  </button>
                  <button
                    className={`result-option ${result?.status === ResultStatus.NOT_FULFILLED ? 'selected not-fulfilled' : ''}`}
                    onClick={() => handleStatusChange(item, ResultStatus.NOT_FULFILLED)}
                  >
                    ✗ {t('notFulfilled')}
                  </button>
                  <button
                    className={`result-option ${result?.status === ResultStatus.NOT_APPLICABLE ? 'selected not-applicable' : ''}`}
                    onClick={() => handleStatusChange(item, ResultStatus.NOT_APPLICABLE)}
                  >
                    — {t('notApplicable')}
                  </button>
                </div>

                <textarea
                  className="comment-input"
                  placeholder={t('addComment')}
                  value={result?.comment || ''}
                  onChange={(e) => handleCommentChange(item, e.target.value)}
                  onBlur={() => handleCommentBlur(item)}
                />

                {/* Current state photo upload and display */}
                <div style={{ marginTop: '0.5rem' }}>
                  {result?.photoUrl ? (
                    <div style={{ padding: '0.5rem', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f57c00' }}>{t('currentState')}:</span>
                      <img 
                        src={`${API_BASE_URL}${result.photoUrl.replace('/api', '')}`}
                        alt={t('currentState')} 
                        style={{ display: 'block', maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid #dce4ec' }}
                      />
                    </div>
                  ) : (
                    <div className="photo-upload">
                      <input
                        type="file"
                        id={`photo-${item.id}`}
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(item, e)}
                        disabled={uploading === item.id}
                      />
                      <label htmlFor={`photo-${item.id}`} className="photo-upload-label">
                        📷 {uploading === item.id ? t('uploading') : t('uploadCurrentStatePhoto')}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/inspections')}
            >
              {t('saveAndExit')}
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? t('completing') : t('completeInspection')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InspectionExecution;
