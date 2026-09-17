import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, ChevronRight, MapPin, Tag, Package } from 'lucide-react';

const Landing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.slice(0, 6)); // Just show latest 6
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary mb-8 border border-blue-100 dark:border-blue-800/50">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-medium">The best way to rent anything</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Rent What You Need, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">When You Need It.</span>
          </h1>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Discover a world of possibilities. Rent high-quality equipment, electronics, and more from trusted owners in your community.
          </p>
          
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex items-center">
            <div className="flex-1 flex items-center px-4 border-r border-slate-100 dark:border-slate-700">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 mr-2" />
              <input type="text" placeholder="What are you looking for?" className="w-full focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent dark:placeholder-slate-400" />
            </div>
            <div className="flex-1 flex items-center px-4 hidden sm:flex">
              <MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500 mr-2" />
              <input type="text" placeholder="Location" className="w-full focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent dark:placeholder-slate-400" />
            </div>
            <button className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-medium transition-colors shadow-md shadow-primary/30">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Latest Arrivals</h2>
              <p className="text-slate-500 dark:text-slate-400">Discover the newest items added by our community.</p>
            </div>
            <Link to="/" className="hidden sm:flex items-center text-primary hover:text-primary-dark font-medium transition-colors">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none dark:hover:border-primary/50 transition-all duration-300 border border-slate-100 dark:border-slate-800 group">
                  <div className="h-56 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    {product.image ? (
                      <img 
                        src={`http://localhost:5000${product.image}`} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=No+Image' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                        <Package className="h-16 w-16 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm">
                      ${product.dailyRent}/day
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                        <Tag className="h-3 w-3" /> {product.category?.name || 'Category'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                        <MapPin className="h-3 w-3" /> {product.location}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">{product.description}</p>
                    <Link 
                      to={`/products/${product.id}`}
                      className="block w-full py-2.5 text-center bg-slate-50 dark:bg-slate-800 hover:bg-primary dark:hover:bg-primary text-slate-700 dark:text-slate-300 hover:text-white rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
