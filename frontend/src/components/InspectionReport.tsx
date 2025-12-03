import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspection, getResultsByInspection } from '../services/api';
import { Inspection, Result, ResultStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const InspectionReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  const fetchData = async (inspectionId: number) => {
    try {
      const [inspectionRes, resultsRes] = await Promise.all([
        getInspection(inspectionId),
        getResultsByInspection(inspectionId)
      ]);
      setInspection(inspectionRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: ResultStatus): string => {
    switch (status) {
      case ResultStatus.FULFILLED:
        return t('fulfilled');
      case ResultStatus.NOT_FULFILLED:
        return t('notFulfilled');
      case ResultStatus.NOT_APPLICABLE:
        return t('notApplicable');
      default:
        return status;
    }
  };

  const getStatusClass = (status: ResultStatus): string => {
    switch (status) {
      case ResultStatus.FULFILLED:
        return 'fulfilled';
      case ResultStatus.NOT_FULFILLED:
        return 'not-fulfilled';
      case ResultStatus.NOT_APPLICABLE:
        return 'not-applicable';
      default:
        return '';
    }
  };

  const calculateSummary = () => {
    const fulfilled = results.filter(r => r.status === ResultStatus.FULFILLED).length;
    const notFulfilled = results.filter(r => r.status === ResultStatus.NOT_FULFILLED).length;
    const notApplicable = results.filter(r => r.status === ResultStatus.NOT_APPLICABLE).length;
    return { fulfilled, notFulfilled, notApplicable };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // For a simple implementation, we'll use the browser's print to PDF functionality
    window.print();
  };

  if (loading) {
    return <div className="loading">{t('loadingReport')}</div>;
  }

  if (!inspection) {
    return <div className="empty-state">{t('inspectionNotFound')}</div>;
  }

  const summary = calculateSummary();

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>{t('inspectionReport')}</h1>
        <h2>{inspection.facilityName}</h2>
        <p>
          {t('date')}: {new Date(inspection.inspectionDate).toLocaleDateString()} | 
          {t('inspector')}: {inspection.responsibleEmployee}
        </p>
        {inspection.checklist && (
          <p>{t('checklist')}: {inspection.checklist.name}</p>
        )}
      </div>

      <div className="report-summary">
        <div className="summary-item fulfilled">
          <div className="value">{summary.fulfilled}</div>
          <div className="label">{t('fulfilled')}</div>
        </div>
        <div className="summary-item not-fulfilled">
          <div className="value">{summary.notFulfilled}</div>
          <div className="label">{t('notFulfilled')}</div>
        </div>
        <div className="summary-item not-applicable">
          <div className="value">{summary.notApplicable}</div>
          <div className="label">{t('notApplicable')}</div>
        </div>
      </div>

      <h3>{t('detailedResults')}</h3>
      
      {results.length === 0 ? (
        <div className="empty-state">
          <p>{t('noResultsRecorded')}</p>
        </div>
      ) : (
        <div className="results-list">
          {results.map((result, index) => (
            <div key={result.id} className="result-item result-item-spaced">
              <div className="result-header">
                <h4>{index + 1}. {result.checklistItem?.description || 'N/A'}</h4>
                <span className={`status-badge ${getStatusClass(result.status)}`}>
                  {getStatusLabel(result.status)}
                </span>
              </div>
              
              {result.comment && (
                <p className="result-comment">
                  <strong>{t('comment')}:</strong> {result.comment}
                </p>
              )}
              
              <div className="result-photos">
                {result.checklistItem?.desiredPhotoUrl && (
                  <div className="desired-state-container">
                    <span className="desired-state-label">{t('desiredState')}:</span>
                    <img 
                      src={`${API_BASE_URL}${result.checklistItem.desiredPhotoUrl.replace('/api', '')}`}
                      alt={t('desiredState')} 
                      className="desired-state-image"
                    />
                  </div>
                )}
                
                {result.photoUrl && (
                  <div className="current-state-wrapper">
                    <span className="current-state-label">{t('currentState')}:</span>
                    <img 
                      src={`${API_BASE_URL}${result.photoUrl.replace('/api', '')}`}
                      alt={t('currentState')} 
                      className="current-state-image"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="report-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/inspections')}>
          {t('backToInspections')}
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          {t('print')}
        </button>
        <button className="btn btn-success" onClick={handleExportPDF}>
          {t('exportPdf')}
        </button>
      </div>
    </div>
  );
};

export default InspectionReport;
