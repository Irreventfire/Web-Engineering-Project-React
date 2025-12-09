import React, { useEffect, useState } from 'react';
import { getChecklists, createChecklist, deleteChecklist, addChecklistItem, deleteChecklistItem, uploadFile, updateChecklistItem, updateChecklist } from '../services/api';
import { Checklist, ChecklistItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const ChecklistManagement: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [newChecklist, setNewChecklist] = useState({ name: '', description: '' });
  const [newItem, setNewItem] = useState({ description: '', orderIndex: 0, desiredPhotoUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [expandedChecklistId, setExpandedChecklistId] = useState<number | null>(null);
  const { t } = useLanguage();
  const { canEdit } = useAuth();

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
    setEditingItem(null);
    setNewItem({ description: '', orderIndex: 0, desiredPhotoUrl: '' });
    setShowItemModal(true);
  };

  const openEditChecklistModal = (checklist: Checklist) => {
    setEditingChecklist(checklist);
    setNewChecklist({ name: checklist.name, description: checklist.description });
    setShowModal(true);
  };

  const openEditItemModal = (checklist: Checklist, item: ChecklistItem) => {
    setSelectedChecklist(checklist);
    setEditingItem(item);
    setNewItem({ 
      description: item.description, 
      orderIndex: item.orderIndex,
      desiredPhotoUrl: item.desiredPhotoUrl || ''
    });
    setShowItemModal(true);
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChecklist) {
        // Update existing checklist
        const response = await updateChecklist(editingChecklist.id, newChecklist);
        setChecklists(checklists.map(c => c.id === editingChecklist.id ? response.data : c));
        setEditingChecklist(null);
      } else {
        // Create new checklist
        const response = await createChecklist(newChecklist);
        setChecklists([...checklists, response.data]);
      }
      setNewChecklist({ name: '', description: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChecklist) return;

    try {
      if (editingItem) {
        // Update existing item
        const response = await updateChecklistItem(editingItem.id, {
          description: newItem.description,
          desiredPhotoUrl: newItem.desiredPhotoUrl
        });
        setChecklists(checklists.map(c => 
          c.id === selectedChecklist.id 
            ? { ...c, items: c.items.map(i => i.id === editingItem.id ? response.data : i) }
            : c
        ));
        setEditingItem(null);
      } else {
        // Add new item
        const response = await addChecklistItem(selectedChecklist.id, {
          ...newItem,
          orderIndex: selectedChecklist.items.length + 1
        });
        setChecklists(checklists.map(c => 
          c.id === selectedChecklist.id 
            ? { ...c, items: [...c.items, response.data] }
            : c
        ));
      }
      
      setNewItem({ description: '', orderIndex: 0, desiredPhotoUrl: '' });
      setShowItemModal(false);
      setSelectedChecklist(null);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const toggleChecklist = (id: number) => {
    setExpandedChecklistId(expandedChecklistId === id ? null : id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNewItem: boolean, item?: ChecklistItem, checklistId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file);
      if (isNewItem) {
        setNewItem({ ...newItem, desiredPhotoUrl: result.url });
      } else if (item && checklistId) {
        // Update existing item with new photo
        await updateChecklistItem(item.id, { desiredPhotoUrl: result.url });
        setChecklists(checklists.map(c => 
          c.id === checklistId 
            ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, desiredPhotoUrl: result.url } : i) }
            : c
        ));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('loadingChecklists')}</div>;
  }

  return (
    <div className="checklist-container">
      <div className="section-header">
        <h2>{t('checklists')}</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            {t('newChecklist')}
          </button>
        )}
      </div>

      {checklists.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noChecklistsYet')}</h3>
          <p>{t('defineInspectionCriteria')}</p>
        </div>
      ) : (
        <div className="checklist-list">
          {checklists.map(checklist => {
            const isExpanded = expandedChecklistId === checklist.id;
            return (
              <div key={checklist.id} className="checklist-card-modern">
                <div className="checklist-header-modern" onClick={() => toggleChecklist(checklist.id)}>
                  <div className="checklist-title-section">
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <div>
                      <h3 className="checklist-title">{checklist.name}</h3>
                      <p className="checklist-description">{checklist.description}</p>
                    </div>
                  </div>
                  <div className="checklist-meta">
                    <span className="item-count-badge">{checklist.items.length} {t('items')}</span>
                    {canEdit && (
                      <div className="checklist-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => openEditChecklistModal(checklist)}
                          title={t('edit')}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDeleteChecklist(checklist.id)}
                          title={t('delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="checklist-body-modern">
                    {checklist.items.length === 0 ? (
                      <div className="empty-items">
                        <p>{t('noItemsYet')}</p>
                      </div>
                    ) : (
                      <ul className="items-list-modern">
                        {checklist.items.map((item, itemIndex) => (
                          <li key={item.id} className="item-row-modern">
                            <div className="item-content">
                              <span className="item-index">{itemIndex + 1}.</span>
                              <span className="item-description">{item.description}</span>
                              {item.desiredPhotoUrl && (
                                <div className="item-photo-preview">
                                  <img 
                                    src={`${API_BASE_URL}${item.desiredPhotoUrl.replace('/api', '')}`}
                                    alt={t('desiredState')} 
                                    className="thumbnail-image"
                                  />
                                  <span className="photo-label">📷</span>
                                </div>
                              )}
                            </div>
                            {canEdit && (
                              <div className="item-actions">
                                <button 
                                  className="btn-icon-small btn-edit-small" 
                                  onClick={() => openEditItemModal(checklist, item)}
                                  title={t('edit')}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="btn-icon-small btn-delete-small" 
                                  onClick={() => handleDeleteItem(checklist.id, item.id)}
                                  title={t('delete')}
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {canEdit && (
                      <div className="add-item-section">
                        <button 
                          className="btn-add-item" 
                          onClick={() => openAddItemModal(checklist)}
                        >
                          + {t('addItem')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Checklist Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingChecklist(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingChecklist ? t('editChecklist') : t('newChecklist')}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingChecklist(null); }}>×</button>
            </div>
            <form onSubmit={handleSaveChecklist}>
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
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingChecklist(null); }}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingChecklist ? t('save') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => { setShowItemModal(false); setEditingItem(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? t('editChecklistItem') : t('addChecklistItem')}</h3>
              <button className="modal-close" onClick={() => { setShowItemModal(false); setEditingItem(null); }}>×</button>
            </div>
            <form onSubmit={handleSaveItem}>
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
              <div className="form-group">
                <label>{t('desiredStatePhoto')}</label>
                <div className="photo-upload">
                  <input
                    type="file"
                    id="newItemPhoto"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    disabled={uploading}
                  />
                  <label htmlFor="newItemPhoto" className="photo-upload-label">
                    📷 {uploading ? t('uploading') : t('uploadPhoto')}
                  </label>
                </div>
                {newItem.desiredPhotoUrl && (
                  <div className="photo-preview-container">
                    <img 
                      src={`${API_BASE_URL}${newItem.desiredPhotoUrl.replace('/api', '')}`}
                      alt={t('desiredState')} 
                      className="preview-image-large"
                    />
                    <button 
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => setNewItem({ ...newItem, desiredPhotoUrl: '' })}
                    >
                      ✕ {t('removePhoto')}
                    </button>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowItemModal(false); setEditingItem(null); }}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editingItem ? t('save') : t('add')}
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
