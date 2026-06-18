import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, X, MessageSquare, RefreshCw, UserPlus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'website_form',
    status: 'new',
  });
  const [editLead, setEditLead] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    source: '',
    status: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, currentPage]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currentPage);
      params.append('limit', 10);
      const response = await api.get(`/leads?${params}`);
      setLeads(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingStatus(id);
    try {
      await api.put(`/leads/${id}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchLeads();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const addNote = async () => {
    // interpret newNote as comma-separated tags and send to tags endpoint
    const tags = (newNote || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return toast.error('Enter at least one tag (comma-separated)');
    try {
      await api.post(`/leads/${selectedLead.id}/notes`, { tags });
      toast.success('Tags added');
      setNewNote('');
      setShowNotesModal(false);
      fetchLeads();
    } catch (error) {
      toast.error('Failed to add tags');
    }
  };

  const addManualLead = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim()) return toast.error('Enter lead name');
    if (!newLead.email.trim()) return toast.error('Enter email');
    if (!newLead.email.includes('@')) return toast.error('Valid email required');

    setSubmitting(true);
    try {
      await api.post('/leads', {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone || null,
        source: newLead.source,
        status: newLead.status,
      });
      toast.success('Lead added successfully!');
      setShowAddModal(false);
      setNewLead({ name: '', email: '', phone: '', source: 'website_form', status: 'new' });
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add lead');
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: Update Lead Details
  const updateLead = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/leads/${editLead.id}/status`, { status: editLead.status });

      // Update other details
      const updateData = {
        name: editLead.name,
        email: editLead.email,
        phone: editLead.phone,
        source: editLead.source,
      };
      await api.put(`/leads/${editLead.id}`, updateData);

      toast.success('Lead updated successfully!');
      setShowEditModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: Delete Lead
  const deleteLead = async (lead) => {
    if (
      window.confirm(
        `Are you sure you want to delete lead "${lead.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await api.delete(`/leads/${lead.id}`);
        toast.success('Lead deleted successfully');
        fetchLeads();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete lead');
      }
    }
  };

  // NEW: Open Edit Modal
  const openEditModal = (lead) => {
    setEditLead({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source || 'website_form',
      status: lead.status,
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    setEditLead({ ...editLead, [e.target.name]: e.target.value });
  };

  const handleInputChange = (e) => {
    setNewLead({ ...newLead, [e.target.name]: e.target.value });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return 'badge-new';
      case 'contacted':
        return 'badge-contacted';
      case 'qualified':
        return 'badge-qualified';
      case 'converted':
        return 'badge-converted';
      case 'lost':
        return 'badge-lost';
      default:
        return '';
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'website_form':
        return 'badge-new';
      case 'referral':
        return 'badge-converted';
      case 'social_media':
        return 'badge-contacted';
      case 'email_campaign':
        return 'badge-qualified';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Lead Management</h1>
            <p className="subtle mt-1">
              Manage and track all your leads in one place
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Lead
            </button>
            <button onClick={() => { window.location.href = '/'; }} className="btn btn-ghost flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await api.get('/leads/export', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'leads_export.csv');
                  document.body.appendChild(link);
                  link.click();
                  link.parentNode.removeChild(link);
                } catch (e) {
                  toast.error('Export failed');
                }
              }}
              className="btn btn-ghost flex items-center gap-2"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 input"
              />
            </div>
            <div className="relative sm:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-300" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 w-full input"
              >
                <option value="">All Status</option>
                <option value="new">🆕 New</option>
                <option value="contacted">📞 Contacted</option>
                <option value="qualified">⭐ Qualified</option>
                <option value="converted">✅ Converted</option>
                <option value="lost">❌ Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Lead
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Tags
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No leads found. Click "Add Lead" to create one.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {lead.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {lead.name}
                            </p>
                            <p className="text-xs text-gray-500">ID: #{lead.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-xs text-gray-400 mt-1">📞 {lead.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${getSourceBadge(lead.source)} text-sm`}>
                          {lead.source?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {lead.tags?.length > 0 ? (
                            lead.tags.map((t) => (
                              <span key={t.id} className="badge bg-white/6 text-sm">
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm subtle">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          disabled={updatingStatus === lead.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer badge ${getStatusBadge(lead.status)}`}
                        >
                          <option value="new">🆕 New</option>
                          <option value="contacted">📞 Contacted</option>
                          <option value="qualified">⭐ Qualified</option>
                          <option value="converted">✅ Converted</option>
                          <option value="lost">❌ Lost</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="Edit Lead"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead)}
                            className="text-rose-600 hover:text-rose-800 transition-colors"
                            title="Delete Lead"
                            style={{ display: user?.role === 'admin' ? 'inline-flex' : 'none' }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowNotesModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                            title="View Notes"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md">
              <div className="flex justify-between p-6 border-b border-white/6">
                <h2 className="text-xl font-bold">Add New Lead</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={addManualLead} className="p-6 space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={newLead.name}
                  onChange={handleInputChange}
                  className="w-full input"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newLead.email}
                  onChange={handleInputChange}
                  className="w-full input"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={newLead.phone}
                  onChange={handleInputChange}
                  className="w-full input"
                />
                <select
                  name="status"
                  value={newLead.status}
                  onChange={handleInputChange}
                  className="w-full input"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <select
                  name="source"
                  value={newLead.source}
                  onChange={handleInputChange}
                  className="w-full input"
                >
                  <option value="website_form">Website Form</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="other">Other</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                    Add Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Lead Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md">
              <div className="flex justify-between p-6 border-b border-white/6">
                <h2 className="text-xl font-bold">Edit Lead</h2>
                <button onClick={() => setShowEditModal(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={updateLead} className="p-6 space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={editLead.name}
                  onChange={handleEditInputChange}
                  className="w-full input"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={editLead.email}
                  onChange={handleEditInputChange}
                  className="w-full input"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={editLead.phone}
                  onChange={handleEditInputChange}
                  className="w-full input"
                />
                <select
                  name="status"
                  value={editLead.status}
                  onChange={handleEditInputChange}
                  className="w-full input"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <select
                  name="source"
                  value={editLead.source}
                  onChange={handleEditInputChange}
                  className="w-full input"
                >
                  <option value="website_form">Website Form</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="other">Other</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-2xl">
              <div className="flex justify-between p-6 border-b border-white/6">
                <div>
                  <h2 className="text-xl font-bold">Notes for {selectedLead.name}</h2>
                  <p className="text-sm subtle">{selectedLead.email}</p>
                </div>
                <button onClick={() => setShowNotesModal(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm subtle">Add tags (comma-separated), e.g. <em>vip, demo</em></p>
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="tag1, tag2, vip"
                  className="w-full input mt-2"
                />
                <button onClick={addNote} className="btn btn-primary mt-3">
                  Add Tags
                </button>
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Tags</h3>
                  {selectedLead.tags?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.tags.map((tag) => (
                        <span key={tag.id} className="px-3 py-1 rounded-full bg-white/6 text-sm">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No tags yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leads;
