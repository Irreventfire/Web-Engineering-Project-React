import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStatistics, getInspections } from '../services/api';
import { Statistics, Inspection, InspectionStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const { canEdit } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, inspectionsRes] = await Promise.all([
          getStatistics(),
          getInspections()
        ]);
        setStatistics(statsRes.data);
        setInspections(inspectionsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) {
    return <div className="loading">{t('loadingDashboard')}</div>;
  }

  return (
    <div className="dashboard">
      <h2>{t('dashboard')}</h2>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card planned">
          <h3>{t('planned')}</h3>
          <div className="value">{statistics?.planned || 0}</div>
        </div>
        <div className="stat-card in-progress">
          <h3>{t('inProgress')}</h3>
          <div className="value">{statistics?.inProgress || 0}</div>
        </div>
        <div className="stat-card completed">
          <h3>{t('completed')}</h3>
          <div className="value">{statistics?.completed || 0}</div>
        </div>
        <div className="stat-card total">
          <h3>{t('totalInspections')}</h3>
          <div className="value">{statistics?.total || 0}</div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="inspection-list">
        <div className="section-header">
          <h3>{t('recentInspections')}</h3>
          {canEdit && (
            <Link to="/inspections/new" className="btn btn-primary">
              {t('newInspection')}
            </Link>
          )}
        </div>
        
        {inspections.length === 0 ? (
          <div className="empty-state">
            <h3>{t('noInspectionsYet')}</h3>
            <p>{t('createFirstInspection')}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('facility')}</th>
                <th>{t('date')}</th>
                <th>{t('employee')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 10).map((inspection) => (
                <tr key={inspection.id}>
                  <td>{inspection.facilityName}</td>
                  <td>{new Date(inspection.inspectionDate).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US')}</td>
                  <td>{inspection.responsibleUser?.name}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(inspection.status)}`}>
                      {getStatusLabel(inspection.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {inspection.status === InspectionStatus.COMPLETED && (
                        <Link to={`/inspections/${inspection.id}/report`} className="btn btn-primary">
                          {t('report')}
                        </Link>
                      )}
                      {canEdit && inspection.status !== InspectionStatus.COMPLETED && (
                        <Link to={`/inspections/${inspection.id}/execute`} className="btn btn-success">
                          {inspection.status === InspectionStatus.PLANNED ? t('start') : t('continue')}
                        </Link>
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

export default Dashboard;
