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
            <h2 className="text-xl font-bold text-gray-900">Manage Sensitive Dictionary</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Customize keywords for risk detection</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
