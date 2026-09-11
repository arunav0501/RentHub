import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, PackagePlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white';

const emptyListing = {
  title: '', description: '', categoryId: '', dailyRent: '', location: '', quantity: 1,
  condition: '', brand: '', model: ''
};

const AIListing = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [categories, setCategories] = useState([]);
  const [listing, setListing] = useState(emptyListing);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then(response => setCategories(response.data))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  const handleImageChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      toast.error('Use JPG, PNG or WebP images');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setListing(emptyListing);
  };

  const analyzeImage = async () => {
    if (!file) return toast.error('Upload a product image first');
    const formData = new FormData();
    formData.append('image', file);
    setAnalyzing(true);
    try {
      const response = await api.post('/ai-listing/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setListing(current => ({
        ...current,
        title: response.data.title || '',
        description: response.data.description || '',
        categoryId: response.data.categoryId || '',
        condition: response.data.condition || '',
        brand: response.data.brand || '',
        model: response.data.model || ''
      }));
      toast.success('AI listing generated. Review the fields before publishing.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateField = (field, value) => setListing(current => ({ ...current, [field]: value }));

  const createProduct = async (event) => {
    event.preventDefault();
    if (!file) return toast.error('Product image is required');
    if (!listing.title.trim() || !listing.description.trim()) return toast.error('Title and description are required');
    if (!listing.categoryId) return toast.error('Select a category');
    if (!listing.dailyRent || Number(listing.dailyRent) <= 0) return toast.error('Enter a valid daily rent');
    if (!listing.location.trim()) return toast.error('Location is required');
    if (!listing.condition.trim()) return toast.error('Condition is required');

    const formData = new FormData();
    Object.entries(listing).forEach(([key, value]) => formData.append(key, value));
    formData.append('image', file);
    setSaving(true);
    try {
      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('AI-assisted listing published successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-7 w-7" /></div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Listing Generator</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Upload an item photo and let RentHub create a draft listing.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">1. Upload product image</h2>
          <label className="block h-80 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer overflow-hidden">
            {preview ? <img src={preview} alt="Product preview" className="w-full h-full object-contain" /> : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ImagePlus className="h-12 w-12 mb-3" />
                <p className="font-medium">Click to upload an image</p>
                <p className="text-sm mt-1">JPG, PNG or WebP</p>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          </label>
          <button type="button" onClick={analyzeImage} disabled={!file || analyzing} className="mt-4 w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {analyzing ? 'AI is analyzing the image...' : 'Analyze Image with AI'}
          </button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">The AI only creates a draft. Always verify the product details, condition and pricing before publishing.</p>
        </div>

        <form onSubmit={createProduct} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Review & publish</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">AI Draft</span>
          </div>
          <div className="space-y-4">
            <Field label="Title" value={listing.title} onChange={value => updateField('title', value)} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea value={listing.description} onChange={event => updateField('description', event.target.value)} rows={4} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select value={listing.categoryId} onChange={event => updateField('categoryId', event.target.value)} className={inputClass}>
                  <option value="">Select category</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <Field label="Condition" value={listing.condition} onChange={value => updateField('condition', value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand" value={listing.brand} onChange={value => updateField('brand', value)} />
              <Field label="Model" value={listing.model} onChange={value => updateField('model', value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Daily Rent" type="number" value={listing.dailyRent} onChange={value => updateField('dailyRent', value)} />
              <Field label="Quantity" type="number" value={listing.quantity} onChange={value => updateField('quantity', value)} />
            </div>
            <Field label="Location" value={listing.location} onChange={value => updateField('location', value)} />
          </div>
          <button type="submit" disabled={saving} className="mt-6 w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <PackagePlus className="h-5 w-5" />}
            {saving ? 'Publishing...' : 'Publish Rental Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <input type={type} value={value} onChange={event => onChange(event.target.value)} className={inputClass} />
  </div>
);

export default AIListing;
