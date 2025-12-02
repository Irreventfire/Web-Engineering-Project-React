import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStatistics, getInspections } from '../services/api';
import { Statistics, Inspection, InspectionStatus } from '../types';

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

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
        return 'Planned';
      case InspectionStatus.IN_PROGRESS:
        return 'In Progress';
      case InspectionStatus.COMPLETED:
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card planned">
          <h3>Planned</h3>
          <div className="value">{statistics?.planned || 0}</div>
        </div>
        <div className="stat-card in-progress">
          <h3>In Progress</h3>
          <div className="value">{statistics?.inProgress || 0}</div>
        </div>
        <div className="stat-card completed">
          <h3>Completed</h3>
          <div className="value">{statistics?.completed || 0}</div>
        </div>
        <div className="stat-card total">
          <h3>Total Inspections</h3>
          <div className="value">{statistics?.total || 0}</div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="inspection-list">
        <div className="section-header">
          <h3>Recent Inspections</h3>
          <Link to="/inspections/new" className="btn btn-primary">
            New Inspection
          </Link>
        </div>
        
        {inspections.length === 0 ? (
          <div className="empty-state">
            <h3>No inspections yet</h3>
            <p>Create your first inspection to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Facility</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 10).map((inspection) => (
                <tr key={inspection.id}>
                  <td>{inspection.facilityName}</td>
                  <td>{new Date(inspection.inspectionDate).toLocaleDateString()}</td>
                  <td>{inspection.responsibleEmployee}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(inspection.status)}`}>
                      {getStatusLabel(inspection.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/inspections/${inspection.id}`} className="btn btn-primary">
                        View
                      </Link>
                      {inspection.status !== InspectionStatus.COMPLETED && (
                        <Link to={`/inspections/${inspection.id}/execute`} className="btn btn-success">
                          {inspection.status === InspectionStatus.PLANNED ? 'Start' : 'Continue'}
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
