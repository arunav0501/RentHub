import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { MapPin, Tag, ArrowLeft, Package, User, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleBookNow = async () => {
    if (!user) {
      toast.error('Please login to book this product');
      navigate('/login');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      toast.error('End date must be after start date');
      return;
    }

    setIsBooking(true);
    try {
      await api.post('/bookings', {
        productId: product.id,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
      toast.success('Booking request sent successfully!');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send booking request');
    } finally {
      setIsBooking(false);
    }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return days > 0 ? (days * product.dailyRent).toFixed(2) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Something went wrong'}</p>
        <Link to="/" className="text-primary hover:text-primary-dark font-medium flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-200 min-h-[calc(100vh-4rem)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors mb-8 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to listings
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Section */}
            <div className="h-64 md:h-auto md:min-h-[500px] bg-slate-100 dark:bg-slate-800 relative">
              {product.image ? (
                <img 
                  src={`http://localhost:5000${product.image}`} 
                  alt={product.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/800x600?text=No+Image' }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <Package className="h-32 w-32 opacity-20" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-1">
                  <Tag className="h-3 w-3 text-primary" /> {product.category?.name}
                </span>
                <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> {product.condition}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-8 lg:p-12 flex flex-col">
              <div className="mb-2">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{product.title}</h1>
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-6">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{product.location}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <span className="text-4xl font-extrabold text-primary">${product.dailyRent}</span>
                <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">/ day</span>
              </div>

              <div className="prose prose-slate dark:prose-invert mb-8 flex-grow">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Description</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Brand</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{product.brand || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Model</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{product.model || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Available Qty</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{product.quantity}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Owner</p>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <User className="h-4 w-4" /> {product.owner?.name}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Request to Rent</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                {startDate && endDate && calculateTotal() > 0 && (
                  <div className="flex justify-between items-center mb-4 text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Total Price:</span>
                    <span className="text-xl text-primary font-bold">${calculateTotal()}</span>
                  </div>
                )}
                <button 
                  onClick={handleBookNow}
                  disabled={isBooking || product.ownerId === user?.id}
                  className="w-full bg-primary hover:bg-primary-dark text-white text-lg font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isBooking ? 'Sending Request...' : product.ownerId === user?.id ? "You own this item" : 'Send Booking Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
