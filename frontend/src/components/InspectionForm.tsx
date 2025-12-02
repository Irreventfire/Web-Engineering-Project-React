import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createInspection, getInspection, updateInspection, getChecklists } from '../services/api';
import { Inspection, Checklist } from '../types';

const InspectionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id !== 'new' && id !== undefined;

  const [formData, setFormData] = useState({
    facilityName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    responsibleEmployee: '',
    checklistId: ''
  });
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChecklists();
    if (isEdit && id) {
      fetchInspection(parseInt(id));
    }
  }, [id, isEdit]);

  const fetchChecklists = async () => {
    try {
      const response = await getChecklists();
      setChecklists(response.data);
    } catch (error) {
      console.error('Error fetching checklists:', error);
    }
  };

  const fetchInspection = async (inspectionId: number) => {
    try {
      const response = await getInspection(inspectionId);
      const inspection = response.data;
      setFormData({
        facilityName: inspection.facilityName,
        inspectionDate: inspection.inspectionDate,
        responsibleEmployee: inspection.responsibleEmployee,
        checklistId: inspection.checklist?.id?.toString() || ''
      });
    } catch (error) {
      console.error('Error fetching inspection:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const inspectionData: Partial<Inspection> = {
      facilityName: formData.facilityName,
      inspectionDate: formData.inspectionDate,
      responsibleEmployee: formData.responsibleEmployee,
      checklist: formData.checklistId 
        ? checklists.find(c => c.id === parseInt(formData.checklistId)) || null
        : null
    };

    try {
      if (isEdit && id) {
        await updateInspection(parseInt(id), inspectionData);
      } else {
        await createInspection(inspectionData);
      }
      navigate('/inspections');
    } catch (error) {
      console.error('Error saving inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{isEdit ? 'Edit Inspection' : 'New Inspection'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="facilityName">Facility Name *</label>
          <input
            type="text"
            id="facilityName"
            name="facilityName"
            value={formData.facilityName}
            onChange={handleChange}
            required
            placeholder="Enter facility name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="inspectionDate">Inspection Date *</label>
          <input
            type="date"
            id="inspectionDate"
            name="inspectionDate"
            value={formData.inspectionDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="responsibleEmployee">Responsible Employee *</label>
          <input
            type="text"
            id="responsibleEmployee"
            name="responsibleEmployee"
            value={formData.responsibleEmployee}
            onChange={handleChange}
            required
            placeholder="Enter employee name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="checklistId">Checklist</label>
          <select
            id="checklistId"
            name="checklistId"
            value={formData.checklistId}
            onChange={handleChange}
          >
            <option value="">Select a checklist (optional)</option>
            {checklists.map(checklist => (
              <option key={checklist.id} value={checklist.id}>
                {checklist.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/inspections')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InspectionForm;
