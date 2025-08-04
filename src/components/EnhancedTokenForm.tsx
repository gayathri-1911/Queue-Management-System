import React, { useState } from 'react';
import { Plus, User, Phone, Settings } from 'lucide-react';
import { ServiceType } from '../types';

interface EnhancedTokenFormProps {
  onSubmit: (tokenData: {
    personName: string;
    contactNumber?: string;
    serviceTypeId?: string;
    priorityLevel?: number;
  }) => Promise<{ error: any }>;
  onCancel: () => void;
  serviceTypes: ServiceType[];
  loading: boolean;
  priorityEnabled: boolean;
}

export function EnhancedTokenForm({ 
  onSubmit, 
  onCancel, 
  serviceTypes, 
  loading, 
  priorityEnabled 
}: EnhancedTokenFormProps) {
  const [personName, setPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [priorityLevel, setPriorityLevel] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    setSubmitting(true);
    const { error } = await onSubmit({
      personName: personName.trim(),
      contactNumber: contactNumber.trim() || undefined,
      serviceTypeId: serviceTypeId || undefined,
      priorityLevel: priorityEnabled ? priorityLevel : 1
    });

    if (!error) {
      setPersonName('');
      setContactNumber('');
      setServiceTypeId('');
      setPriorityLevel(1);
      onCancel();
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Plus className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Add Person to Queue</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Person Name *
          </label>
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Enter person's name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Contact Number (Optional)
          </label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="Enter contact number..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {serviceTypes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Settings className="w-4 h-4 inline mr-1" />
              Service Type (Optional)
            </label>
            <select
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select service type...</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.estimated_duration_minutes} min)
                </option>
              ))}
            </select>
          </div>
        )}

        {priorityEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Normal Priority</option>
              <option value={2}>High Priority</option>
              <option value={3}>VIP Priority</option>
            </select>
          </div>
        )}

        {serviceTypes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Settings className="w-4 h-4 inline mr-1" />
              Service Type (Optional)
            </label>
            <select
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select service type...</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.estimated_duration_minutes} min)
                </option>
              ))}
            </select>
          </div>
        )}

        {priorityEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Normal Priority</option>
              <option value={2}>High Priority</option>
              <option value={3}>VIP Priority</option>
            </select>
          </div>
        )}

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={submitting || !personName.trim()}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Queue</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}