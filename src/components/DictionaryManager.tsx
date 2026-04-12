/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { Category, Dictionary, DEFAULT_SENSITIVE_DICTIONARY } from '../lib/analyzer';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './Dashboard';

interface DictionaryManagerProps {
  dictionary: Dictionary;
  onSave: (newDictionary: Dictionary) => void;
  onClose: () => void;
  onReset: () => void;
}

export function DictionaryManager({ dictionary, onSave, onClose, onReset }: DictionaryManagerProps) {
  const [tempDictionary, setTempDictionary] = useState<Dictionary>({ ...dictionary });
  const [newKeywords, setNewKeywords] = useState<Record<string, string>>({});

  // Category threat levels based on risk calculation weights
  const CATEGORY_THREATS: Record<Category, { level: 'High' | 'Medium' | 'Low'; description: string }> = {
    SECURITY: { level: 'High', description: 'Passwords, PINs, OTPs, tokens, ATM data' },
    FINANCIAL: { level: 'High', description: 'Account numbers, IBAN, SWIFT, card details, CVV' },
    PII: { level: 'Medium', description: 'Names, addresses, phone numbers, DOB, SSN' },
    EMAIL: { level: 'Low', description: 'Email addresses and related identifiers' },
    CONTACT: { level: 'Low', description: 'Phone numbers, addresses, contact information' },
    NONE: { level: 'Low', description: 'Non-sensitive data categories' }
  };

  const handleAddKeyword = (category: Category) => {
    const keyword = newKeywords[category]?.trim().toLowerCase();
    if (!keyword) return;

    if (!tempDictionary[category].includes(keyword)) {
      setTempDictionary(prev => ({
        ...prev,
        [category]: [...prev[category], keyword]
      }));
    }
    setNewKeywords(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveKeyword = (category: Category, keyword: string) => {
    setTempDictionary(prev => ({
      ...prev,
      [category]: prev[category].filter(k => k !== keyword)
    }));
  };

  const handleSave = () => {
    onSave(tempDictionary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Keywords</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Customize keywords for risk detection</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Category Threat Levels Section */}
          <div className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Category Threat Levels
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Understanding risk levels helps you prioritize which categories to monitor. Higher threat categories contribute more to overall template risk scores.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(CATEGORY_THREATS) as [Category, typeof CATEGORY_THREATS[Category]][])
                .filter(([category]) => category !== 'NONE')
                .map(([category, threat]) => (
                  <div key={category} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div style={{ color: CATEGORY_COLORS[category] }}>
                          {CATEGORY_ICONS[category]}
                        </div>
                        <span className="font-bold text-sm text-gray-900">{category}</span>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${threat.level === 'High' ? 'bg-red-100 text-red-700' :
                        threat.level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {threat.level} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{threat.description}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Keyword Management Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.keys(tempDictionary) as Category[]).filter(cat => cat !== 'NONE').map(category => (
              <div key={category} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2" style={{ color: CATEGORY_COLORS[category] }}>
                    {CATEGORY_ICONS[category]}
                    <span className="font-bold text-sm uppercase tracking-wide">{category}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100">
                    {tempDictionary[category].length} Keywords
                  </span>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    value={newKeywords[category] || ''}
                    onChange={(e) => setNewKeywords(prev => ({ ...prev, [category]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(category)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
                  />
                  <button
                    onClick={() => handleAddKeyword(category)}
                    className="p-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex flex-wrap gap-2 content-start min-h-[100px]">
                  {tempDictionary[category].map(keyword => (
                    <div
                      key={keyword}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 group hover:border-red-200 hover:bg-red-50 transition-all"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(category, keyword)}
                        className="text-gray-300 group-hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {tempDictionary[category].length === 0 && (
                    <p className="text-[11px] text-gray-400 italic w-full text-center mt-4">No keywords defined</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-2 bg-gray-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-900 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
