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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { canEdit } = useAuth();

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
    return i.status === filter;
  });

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
          <option value={InspectionStatus.PLANNED}>{t('planned')}</option>
          <option value={InspectionStatus.IN_PROGRESS}>{t('inProgress')}</option>
          <option value={InspectionStatus.COMPLETED}>{t('completed')}</option>
        </select>
      </div>

      <div className="inspection-list">
        {filteredInspections.length === 0 ? (
          <div className="empty-state">
            <h3>{t('noInspectionsFound')}</h3>
            <p>{t('createNewInspection')}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('facility')}</th>
                <th>{t('date')}</th>
                <th>{t('employee')}</th>
                <th>{t('checklist')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td>{inspection.facilityName}</td>
                  <td>{new Date(inspection.inspectionDate).toLocaleDateString()}</td>
                  <td>{inspection.responsibleEmployee}</td>
                  <td>{inspection.checklist?.name || t('notAssigned')}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(inspection.status)}`}>
                      {getStatusLabel(inspection.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {canEdit && inspection.status === InspectionStatus.PLANNED && (
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            handleStatusChange(inspection.id, InspectionStatus.IN_PROGRESS);
                            navigate(`/inspections/${inspection.id}/execute`);
                          }}
                        >
                          {t('start')}
                        </button>
                      )}
                      {canEdit && inspection.status === InspectionStatus.IN_PROGRESS && (
                        <>
                          <Link to={`/inspections/${inspection.id}/execute`} className="btn btn-warning">
                            {t('continue')}
                          </Link>
                          <button
                            className="btn btn-success"
                            onClick={() => handleStatusChange(inspection.id, InspectionStatus.COMPLETED)}
                          >
                            {t('complete')}
                          </button>
                        </>
                      )}
                      {inspection.status === InspectionStatus.COMPLETED && (
                        <Link to={`/inspections/${inspection.id}/report`} className="btn btn-primary">
                          {t('report')}
                        </Link>
                      )}
                      {canEdit && (
                        <Link to={`/inspections/${inspection.id}/edit`} className="btn btn-secondary">
                          {t('edit')}
                        </Link>
                      )}
                      {canEdit && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(inspection.id)}
                        >
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InspectionList;
