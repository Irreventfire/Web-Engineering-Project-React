import React, { useEffect, useState } from 'react';
import { getChecklists, createChecklist, deleteChecklist, addChecklistItem, deleteChecklistItem } from '../services/api';
import { Checklist } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ChecklistManagement: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [newChecklist, setNewChecklist] = useState({ name: '', description: '' });
  const [newItem, setNewItem] = useState({ description: '', orderIndex: 0 });
  const { t } = useLanguage();

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await getChecklists();
      setChecklists(response.data);
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createChecklist(newChecklist);
      setChecklists([...checklists, response.data]);
      setNewChecklist({ name: '', description: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  const handleDeleteChecklist = async (id: number) => {
    if (window.confirm(t('deleteChecklistConfirm'))) {
      try {
        await deleteChecklist(id);
        setChecklists(checklists.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting checklist:', error);
      }
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChecklist) return;

    try {
      const response = await addChecklistItem(selectedChecklist.id, {
        ...newItem,
        orderIndex: selectedChecklist.items.length + 1
      });
      
      // Update the checklist with the new item
      setChecklists(checklists.map(c => 
        c.id === selectedChecklist.id 
          ? { ...c, items: [...c.items, response.data] }
          : c
      ));
      
      setNewItem({ description: '', orderIndex: 0 });
      setShowItemModal(false);
      setSelectedChecklist(null);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (checklistId: number, itemId: number) => {
    try {
      await deleteChecklistItem(itemId);
      setChecklists(checklists.map(c => 
        c.id === checklistId 
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      ));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const openAddItemModal = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setShowItemModal(true);
  };

  if (loading) {
    return <div className="loading">{t('loadingChecklists')}</div>;
  }

  return (
    <div className="checklist-container">
      <div className="section-header">
        <h2>{t('checklists')}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          {t('newChecklist')}
        </button>
      </div>

      {checklists.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noChecklistsYet')}</h3>
          <p>{t('defineInspectionCriteria')}</p>
        </div>
      ) : (
        <div className="checklist-grid">
          {checklists.map(checklist => (
            <div key={checklist.id} className="checklist-card">
              <div className="checklist-card-header">
                <h4>{checklist.name}</h4>
                <p>{checklist.description}</p>
              </div>
              <div className="checklist-items">
                {checklist.items.length === 0 ? (
                  <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>{t('noItemsYet')}</p>
                ) : (
                  checklist.items.map(item => (
                    <div key={item.id} className="checklist-item">
                      <span className="item-number">{item.orderIndex}</span>
                      <span>{item.description}</span>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid #e9ecef' }}>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => openAddItemModal(checklist)}
                  >
                    {t('addItem')}
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDeleteChecklist(checklist.id)}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Checklist Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('newChecklist')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateChecklist}>
              <div className="form-group">
                <label htmlFor="name">{t('name')} *</label>
                <input
                  type="text"
                  id="name"
                  value={newChecklist.name}
                  onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                  required
                  placeholder={t('enterChecklistName')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">{t('description')}</label>
                <textarea
                  id="description"
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                  placeholder={t('enterDescription')}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('addChecklistItem')}</h3>
              <button className="modal-close" onClick={() => setShowItemModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label htmlFor="itemDescription">{t('description')} *</label>
                <input
                  type="text"
                  id="itemDescription"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  required
                  placeholder={t('enterItemDescription')}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistManagement;
