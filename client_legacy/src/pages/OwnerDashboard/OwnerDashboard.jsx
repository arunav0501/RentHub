import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Package, X, Loader2, CalendarClock, CheckCircle, XCircle, Sparkles, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import TrustScoreBadge from '../../components/trust/TrustScoreBadge';
import TrustScoreCard from '../../components/trust/TrustScoreCard';

const productSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  dailyRent: z.coerce.number().min(0.01, "Daily rent must be positive"),
  location: z.string().min(3, "Location is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  condition: z.string().min(2, "Condition is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
});

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'requests'
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // AI Image -> Listing States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema)
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, requestsRes] = await Promise.all([
        api.get('/products/owner/my-products'),
        api.get('/categories'),
        api.get('/bookings/owner-requests')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setRequests(requestsRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    reset();
    setIsEditMode(false);
    setImageFile(null);
    setAiSuccess(false);
    setAiError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setCurrentProductId(product.id);
    setImageFile(null);
    setAiSuccess(false);
    setAiError(null);
    Object.keys(product).forEach(key => {
      if (key !== 'image' && key !== 'category') {
        setValue(key, product[key]);
      }
    });
    setIsModalOpen(true);
  };

  const handleGenerateWithAi = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    setAiSuccess(false);

    // Dynamic step ticker for AI loading indicator
    const interval = setInterval(() => {
      setAnalyzingStep((prev) => (prev + 1) % 4);
    }, 1200);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const res = await api.post('/ai-listing/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { title, description, categoryId, brand, model, condition } = res.data;

      if (title) setValue('title', title, { shouldValidate: true });
      if (description) setValue('description', description, { shouldValidate: true });
      if (categoryId) setValue('categoryId', categoryId, { shouldValidate: true });
      if (brand) setValue('brand', brand);
      if (model) setValue('model', model);
      if (condition) setValue('condition', condition, { shouldValidate: true });

      setAiSuccess(true);
      toast.success('✨ Listing generated! Please review details before saving.');
    } catch (err) {
      console.error('AI generation error:', err);
      const msg = err.response?.data?.message || "We couldn't analyze this image. You can continue creating the listing manually.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (isEditMode) {
        await api.put(`/products/${currentProductId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Product added successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your rental listings and requests</p>
        </div>
        <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'products' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'}`}
          >
            My Products
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'requests' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'}`}
          >
            Rental Requests
            {requests.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Listed Products</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{products.length}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Expand your rental business</span>
                <button 
                  onClick={openAddModal}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Product
                </button>
              </div>
            </div>
            <div className="lg:col-span-2">
              {user && <TrustScoreCard userId={user.id} role="OWNER" />}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                <Package className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium">No products listed yet</p>
                <p className="text-sm">Click "Add Product" to start earning.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price/Day</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700">
                              {product.image ? (
                                <img className="h-10 w-10 object-cover" src={`http://localhost:5000${product.image}`} alt="" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-slate-400"/></div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{product.title}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{product.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.category?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-medium">
                          ${product.dailyRent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openEditModal(product)} className="text-primary hover:text-primary-dark mr-4 transition-colors">
                            <Edit className="h-5 w-5 inline" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <RentalRequests requests={requests} onUpdate={fetchData} />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            </div>
            <div className="relative inline-block align-bottom bg-white dark:bg-slate-900 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl leading-6 font-bold text-slate-900 dark:text-white">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
                {/* AI Image -> Listing Assistant for New Products */}
                {!isEditMode && (
                  <div className="mb-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 dark:from-slate-800/90 dark:via-indigo-950/30 dark:to-slate-800/90 rounded-2xl p-4 border border-blue-100 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            AI Image → Listing
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-primary">
                              Gemini
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Upload a product photo to automatically generate title, description, and specs
                          </p>
                        </div>
                      </div>
                    </div>

                    {!imageFile ? (
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <input
                          type="file"
                          id="ai-product-image"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                              setAiSuccess(false);
                              setAiError(null);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="ai-product-image"
                          className="cursor-pointer px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" /> Choose Product Image
                        </label>
                        <span className="text-xs text-slate-400">Supports JPG, PNG, WebP (up to 5MB)</span>
                      </div>
                    ) : (
                      <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            <img
                              src={URL.createObjectURL(imageFile)}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {imageFile.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <label
                              htmlFor="ai-product-image-change"
                              className="text-[11px] text-primary hover:underline cursor-pointer inline-block mt-0.5 font-medium"
                            >
                              Change Image
                            </label>
                            <input
                              type="file"
                              id="ai-product-image-change"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setImageFile(e.target.files[0]);
                                  setAiSuccess(false);
                                  setAiError(null);
                                }
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateWithAi}
                          disabled={isAnalyzing}
                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 text-amber-300" />
                              <span>Generate with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Step-by-step loading state */}
                    {isAnalyzing && (
                      <div className="mt-3 p-3 bg-blue-50/90 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            ✨ Analyzing your product with Gemini...
                          </p>
                          <p className="text-[11px] text-primary font-medium transition-all">
                            {analyzingStep === 0 && '🔍 Identifying product details'}
                            {analyzingStep === 1 && '✍️ Generating listing title'}
                            {analyzingStep === 2 && '📝 Writing description'}
                            {analyzingStep === 3 && '🏷️ Finding category match'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Success disclaimer banner */}
                    {aiSuccess && (
                      <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>✨ AI-generated suggestions — please review and enter your price & location before publishing.</span>
                      </div>
                    )}

                    {/* Error banner */}
                    {aiError && (
                      <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>{aiError} You can continue creating the listing manually below.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input {...register('title')} type="text" className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                    {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select {...register('categoryId')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900">
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea {...register('description')} rows={3} className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                    {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Daily Rent ($)</label>
                    <input {...register('dailyRent')} type="number" step="0.01" className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                    {errors.dailyRent && <p className="mt-1 text-xs text-red-500">{errors.dailyRent.message}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                    <input {...register('quantity')} type="number" className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                    {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity.message}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                    <input {...register('location')} type="text" className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                    {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Condition</label>
                    <select {...register('condition')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900">
                      <option value="">Select condition</option>
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                    {errors.condition && <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Brand (Optional)</label>
                    <input {...register('brand')} type="text" className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model (Optional)</label>
                    <input {...register('model')} type="text" className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900" />
                  </div>
                  
                  {isEditMode && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Image (Optional to replace)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary focus:border-primary px-3 py-2 border bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100" 
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium transition-colors shadow-md shadow-primary/30">
                    {isEditMode ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RentalRequests = ({ requests, onUpdate }) => {
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      toast.success(`Booking ${status.toLowerCase()}`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <CalendarClock className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-lg font-medium">No rental requests yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Renter</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                  {request.product?.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{request.user?.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{request.user?.email}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{request.user?.phone}</div>
                  <div className="mt-1.5">
                    <TrustScoreBadge userId={request.userId || request.user?.id} role="RENTER" size="sm" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {new Date(request.startDate).toLocaleDateString()} - <br/>
                  {new Date(request.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                  ${request.totalPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${request.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                      request.status === 'REJECTED' || request.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {request.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(request.id, 'APPROVED')} className="text-green-600 hover:text-green-900 transition-colors bg-green-50 px-3 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button onClick={() => handleUpdateStatus(request.id, 'REJECTED')} className="text-red-600 hover:text-red-900 transition-colors bg-red-50 px-3 py-1 rounded-lg flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  )}
                  {request.status === 'APPROVED' && (
                    <button onClick={() => handleUpdateStatus(request.id, 'COMPLETED')} className="text-blue-600 hover:text-blue-900 transition-colors bg-blue-50 px-3 py-1 rounded-lg">
                      Mark Completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnerDashboard;
