import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInspections, deleteInspection, updateInspectionStatus } from '../services/api';
import { Inspection, InspectionStatus } from '../types';

const InspectionList: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

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
    if (window.confirm('Are you sure you want to delete this inspection?')) {
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
        return 'Planned';
      case InspectionStatus.IN_PROGRESS:
        return 'In Progress';
      case InspectionStatus.COMPLETED:
        return 'Completed';
      default:
        return status;
    }
  };

  const filteredInspections = inspections.filter(i => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading inspections...</div>;
  }

  return (
    <div className="dashboard">
      <div className="section-header">
        <h2>Inspections</h2>
        <Link to="/inspections/new" className="btn btn-primary">
          New Inspection
        </Link>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #dce4ec' }}
        >
          <option value="all">All Inspections</option>
          <option value={InspectionStatus.PLANNED}>Planned</option>
          <option value={InspectionStatus.IN_PROGRESS}>In Progress</option>
          <option value={InspectionStatus.COMPLETED}>Completed</option>
        </select>
      </div>

      <div className="inspection-list">
        {filteredInspections.length === 0 ? (
          <div className="empty-state">
            <h3>No inspections found</h3>
            <p>Create a new inspection to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Facility</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Checklist</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td>{inspection.facilityName}</td>
                  <td>{new Date(inspection.inspectionDate).toLocaleDateString()}</td>
                  <td>{inspection.responsibleEmployee}</td>
                  <td>{inspection.checklist?.name || 'Not assigned'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(inspection.status)}`}>
                      {getStatusLabel(inspection.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {inspection.status === InspectionStatus.PLANNED && (
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            handleStatusChange(inspection.id, InspectionStatus.IN_PROGRESS);
                            navigate(`/inspections/${inspection.id}/execute`);
                          }}
                        >
                          Start
                        </button>
                      )}
                      {inspection.status === InspectionStatus.IN_PROGRESS && (
                        <>
                          <Link to={`/inspections/${inspection.id}/execute`} className="btn btn-warning">
                            Continue
                          </Link>
                          <button
                            className="btn btn-success"
                            onClick={() => handleStatusChange(inspection.id, InspectionStatus.COMPLETED)}
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {inspection.status === InspectionStatus.COMPLETED && (
                        <Link to={`/inspections/${inspection.id}/report`} className="btn btn-primary">
                          Report
                        </Link>
                      )}
                      <Link to={`/inspections/${inspection.id}/edit`} className="btn btn-secondary">
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(inspection.id)}
                      >
                        Delete
                      </button>
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
