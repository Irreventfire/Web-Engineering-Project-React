import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspection, getResultsByInspection } from '../services/api';
import { Inspection, Result, ResultStatus } from '../types';

const InspectionReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

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
        return 'Fulfilled';
      case ResultStatus.NOT_FULFILLED:
        return 'Not Fulfilled';
      case ResultStatus.NOT_APPLICABLE:
        return 'N/A';
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
    return <div className="loading">Loading report...</div>;
  }

  if (!inspection) {
    return <div className="empty-state">Inspection not found</div>;
  }

  const summary = calculateSummary();

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Inspection Report</h1>
        <h2>{inspection.facilityName}</h2>
        <p>
          Date: {new Date(inspection.inspectionDate).toLocaleDateString()} | 
          Inspector: {inspection.responsibleEmployee}
        </p>
        {inspection.checklist && (
          <p>Checklist: {inspection.checklist.name}</p>
        )}
      </div>

      <div className="report-summary">
        <div className="summary-item fulfilled">
          <div className="value">{summary.fulfilled}</div>
          <div className="label">Fulfilled</div>
        </div>
        <div className="summary-item not-fulfilled">
          <div className="value">{summary.notFulfilled}</div>
          <div className="label">Not Fulfilled</div>
        </div>
        <div className="summary-item not-applicable">
          <div className="value">{summary.notApplicable}</div>
          <div className="label">N/A</div>
        </div>
      </div>

      <h3>Detailed Results</h3>
      
      {results.length === 0 ? (
        <div className="empty-state">
          <p>No results recorded for this inspection.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Check Item</th>
              <th>Result</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={result.id}>
                <td>{index + 1}</td>
                <td>{result.checklistItem?.description || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(result.status)}`}>
                    {getStatusLabel(result.status)}
                  </span>
                </td>
                <td>{result.comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="report-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/inspections')}>
          Back to Inspections
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          Print Report
        </button>
        <button className="btn btn-success" onClick={handleExportPDF}>
          Export as PDF
        </button>
      </div>
    </div>
  );
};

export default InspectionReport;
