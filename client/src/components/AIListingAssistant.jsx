import React, { useState } from 'react';
import { Sparkles, Loader2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AIListingAssistant = ({ onApply }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const generateListing = async () => {
    if (!file) {
      toast.error('Upload a product image first');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await api.post('/ai-listing/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onApply(response.data, file);
      toast.success('AI listing generated. Please review it before publishing.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'AI listing generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-2 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">AI Listing Generator</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload a photo and RentHub will suggest the listing details.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <label className="w-full sm:w-40 h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden">
          {preview ? (
            <img src={preview} alt="Product preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-400">
              <ImagePlus className="h-7 w-7 mx-auto mb-1" />
              <span className="text-xs">Upload image</span>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
        </label>

        <div className="flex-1">
          <button
            type="button"
            onClick={generateListing}
            disabled={!file || loading}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Analyzing image...' : 'Generate Listing'}
          </button>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            AI suggestions are estimates. Review all fields before publishing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIListingAssistant;
