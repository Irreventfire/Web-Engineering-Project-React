import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInspections, deleteInspection, updateInspectionStatus } from '../services/api';
import { Inspection, InspectionStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const InspectionList: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedInspectionId, setExpandedInspectionId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { canEdit, user } = useAuth();

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await getInspections();
      setInspections(response.data);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('deleteInspectionConfirm'))) {
      try {
        await deleteInspection(id);
        setInspections(inspections.filter(i => i.id !== id));
      } catch (error) {
        console.error('Error deleting inspection:', error);
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: InspectionStatus) => {
    try {
      await updateInspectionStatus(id, newStatus);
      setInspections(inspections.map(i => 
        i.id === id ? { ...i, status: newStatus } : i
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusClass = (status: InspectionStatus): string => {
    switch (status) {
      case InspectionStatus.PLANNED:
        return 'planned';
      case InspectionStatus.IN_PROGRESS:
        return 'in-progress';
      case InspectionStatus.COMPLETED:
        return 'completed';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: InspectionStatus): string => {
    switch (status) {
      case InspectionStatus.PLANNED:
        return t('planned');
      case InspectionStatus.IN_PROGRESS:
        return t('inProgress');
      case InspectionStatus.COMPLETED:
        return t('completed');
      default:
        return status;
    }
  };

  const filteredInspections = inspections.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'myInspections') return i.responsibleUser?.id === user?.id;
    return i.status === filter;
  });

  const toggleInspection = (id: number) => {
    setExpandedInspectionId(expandedInspectionId === id ? null : id);
  };

  if (loading) {
    return <div className="loading">{t('loadingInspections')}</div>;
  }

  return (
    <div className="dashboard">
      <div className="section-header">
        <h2>{t('inspections')}</h2>
        {canEdit && (
          <Link to="/inspections/new" className="btn btn-primary">
            {t('newInspection')}
          </Link>
        )}
      </div>

      <div className="form-group filter-select-container">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
          aria-label="Filter inspections by status"
        >
          <option value="all">{t('allInspections')}</option>
          <option value="myInspections">{t('myInspections')}</option>
          <option value={InspectionStatus.PLANNED}>{t('planned')}</option>
          <option value={InspectionStatus.IN_PROGRESS}>{t('inProgress')}</option>
          <option value={InspectionStatus.COMPLETED}>{t('completed')}</option>
        </select>
      </div>

      {filteredInspections.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noInspectionsFound')}</h3>
          <p>{t('createNewInspection')}</p>
        </div>
      ) : (
        <div className="inspection-list-modern">
          {filteredInspections.map((inspection) => {
            const isExpanded = expandedInspectionId === inspection.id;
            return (
              <div key={inspection.id} className="inspection-card-modern">
                <div className="inspection-header-modern" onClick={() => toggleInspection(inspection.id)}>
                  <div className="inspection-title-section">
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <div>
                      <h3 className="inspection-title">{inspection.facilityName}</h3>
                      <p className="inspection-subtitle">
                        {t('employee')}: {inspection.responsibleUser?.name}
                      </p>
                    </div>
                  </div>
                  <div className="inspection-meta">
                    <span className="date-badge">{new Date(inspection.inspectionDate).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    <span className={`status-badge-modern ${getStatusClass(inspection.status)}`}>
                      {getStatusLabel(inspection.status)}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="inspection-body-modern">
                    <div className="inspection-details">
                      <div className="detail-item">
                        <span className="detail-label">{t('checklist')}:</span>
                        <span className="detail-value">{inspection.checklist?.name || t('notAssigned')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{t('date')}:</span>
                        <span className="detail-value">{new Date(inspection.inspectionDate).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{t('status')}:</span>
                        <span className={`status-badge ${getStatusClass(inspection.status)}`}>
                          {getStatusLabel(inspection.status)}
                        </span>
                      </div>
                    </div>

                    <div className="inspection-actions">
                      {canEdit && inspection.status === InspectionStatus.PLANNED && (
                        <button
                          className="btn-action btn-success"
                          onClick={() => {
                            handleStatusChange(inspection.id, InspectionStatus.IN_PROGRESS);
                            navigate(`/inspections/${inspection.id}/execute`);
                          }}
                        >
                          ▸ {t('start')}
                        </button>
                      )}
                      {canEdit && inspection.status === InspectionStatus.IN_PROGRESS && (
                        <>
                          <Link to={`/inspections/${inspection.id}/execute`} className="btn-action btn-warning">
                            ▸ {t('continue')}
                          </Link>
                          <button
                            className="btn-action btn-success"
                            onClick={() => handleStatusChange(inspection.id, InspectionStatus.COMPLETED)}
                          >
                            ✓ {t('complete')}
                          </button>
                        </>
                      )}
                      {inspection.status === InspectionStatus.COMPLETED && (
                        <Link to={`/inspections/${inspection.id}/report`} className="btn-action btn-primary">
                          ≡ {t('report')}
                        </Link>
                      )}
                      {canEdit && (
                        <Link to={`/inspections/${inspection.id}/edit`} className="btn-action btn-secondary">
                          ✎ {t('edit')}
                        </Link>
                      )}
                      {canEdit && (
                        <button
                          className="btn-action btn-danger"
                          onClick={() => handleDelete(inspection.id)}
                        >
                          × {t('delete')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InspectionList;
