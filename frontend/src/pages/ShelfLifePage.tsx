import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, X, Trash2, AlertTriangle, CheckCircle, Info, Package, Edit } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const shelfLifeDataset = [
  { crop: "Wheat", shelf_life_days: 90 },
  { crop: "Rice", shelf_life_days: 180 },
  { crop: "Maize", shelf_life_days: 120 },
  { crop: "Soybean", shelf_life_days: 150 },
  { crop: "Potato", shelf_life_days: 30 },
  { crop: "Onion", shelf_life_days: 60 },
  { crop: "Tomato", shelf_life_days: 10 },
  { crop: "Cotton", shelf_life_days: 365 }
];

export default function ShelfLifePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedItemForSale, setSelectedItemForSale] = useState<any>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    crop_name: shelfLifeDataset[0].crop,
    quantity: '',
    unit: 'kg',
    price_per_kg: '',
    price_per_quintal: '',
    total_investment: '',
    harvest_date: new Date().toISOString().slice(0, 10),
    images: [] as string[]
  });

  const [sellForm, setSellForm] = useState({
    quantity: '',
    unit: 'kg',
    price: '',
    pricePerQuintal: '',
    source: 'Market',
    notes: ''
  });

  const getToken = () => {
    const str = localStorage.getItem('agrovision_user');
    if (!str) return null;
    return JSON.parse(str)?.token;
  };

  const fetchStorage = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const token = getToken();
      
      // Fetch normal storage items
      const res1 = await fetch(`${API_URL}/api/storage/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let storageData = [];
      if (res1.ok) {
        storageData = await res1.json();
      }

      // Fetch lifecycle shelf monitoring items
      const res2 = await fetch(`${API_URL}/api/lifecycle/shelf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let shelfData = [];
      if (res2.ok) {
        shelfData = await res2.json();
      }

      // Combine them
      const combinedShelfData = shelfData.map((s: any) => {
        const harvestDate = s.harvestDate ? new Date(s.harvestDate) : new Date();
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - harvestDate.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const shelfLife = s.shelfLifeDays || 30;
        const remainingDays = shelfLife - daysPassed;

        return {
          ...s,
          isLifecycle: true,
          crop_name: s.cropName,
          harvest_date: s.harvestDate,
          quantity: s.quantity || 0,
          unit: s.unit || 'kg',
          price_per_kg: s.pricePerKg || 0,
          shelf_life_days: shelfLife,
          days_passed: daysPassed,
          remaining_days: remainingDays
        };
      });

      setItems([...storageData, ...combinedShelfData]);
    } catch (error) {
      console.error('Failed to fetch storage', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, [user?._id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/api/storage/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          price_per_kg: Number(form.price_per_kg) || 0,
          price_per_quintal: Number(form.price_per_quintal) || 0,
          total_investment: Number(form.total_investment) || 0
        })
      });

      const data = await res.json();

      if (res.ok) {
        setShowAddModal(false);
        fetchStorage();
        setForm({
          crop_name: shelfLifeDataset[0].crop,
          quantity: '',
          unit: 'kg',
          price_per_kg: '',
          price_per_quintal: '',
          total_investment: '',
          harvest_date: new Date().toISOString().slice(0, 10),
          images: [] as string[]
        });
      } else {
        setError(data.message || 'Failed to save record. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add storage', error);
      setError('Connection error. Please check if the server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForSale) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const token = getToken();
      const url = selectedItemForSale.isLifecycle 
        ? `${API_URL}/api/lifecycle/shelf/${selectedItemForSale._id}/complete`
        : `${API_URL}/api/storage/${selectedItemForSale._id}/sell`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: Number(sellForm.quantity),
          sellingPrice: Number(sellForm.price), // backend expects sellingPrice for lifecycle
          price: Number(sellForm.price), // and price for old storage
          source: sellForm.source,
          notes: sellForm.notes
        })
      });

      const data = await res.json();

      if (res.ok) {
        setShowSellModal(false);
        fetchStorage();
        setSellForm({ quantity: '', unit: 'kg', price: '', pricePerQuintal: '', source: 'Market', notes: '' });
      } else {
        setError(data.message || 'Failed to process sale. Please try again.');
      }
    } catch (error) {
      console.error('Failed to sell storage', error);
      setError('Connection error. Please check if the server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/api/storage/${selectedItemForEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: Number(form.quantity),
          unit: form.unit,
          price_per_kg: Number(form.price_per_kg) || 0,
          price_per_quintal: Number(form.price_per_quintal) || 0,
          total_investment: Number(form.total_investment) || 0,
          harvest_date: form.harvest_date,
          images: form.images
        })
      });

      const data = await res.json();

      if (res.ok) {
        setShowEditModal(false);
        fetchStorage();
      } else {
        setError(data.message || 'Failed to update record. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update storage', error);
      setError('Connection error. Please check if the server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this storage record?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/storage/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStorage();
      }
    } catch (error) {
      console.error('Failed to delete storage', error);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'SAFE':
        return { label: 'Safe', color: 'text-success', bg: 'bg-success', icon: CheckCircle };
      case 'WARNING':
        return { label: 'Warning', color: 'text-warning', bg: 'bg-warning', icon: AlertTriangle };
      case 'CRITICAL':
        return { label: 'Critical', color: 'text-destructive', bg: 'bg-destructive', icon: AlertTriangle };
      default:
        return { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted', icon: Info };
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{t('shelfPage.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{t('shelfPage.subtitle')}</p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setError(null); }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d text-sm md:text-base"
          >
            <Plus className="w-5 h-5" /> {t('shelfPage.addRecord')}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('shelfPage.loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 card-3d rounded-3xl border-dashed">
            <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground">{t('shelfPage.noCrops')}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{t('shelfPage.noCropsDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item, i) => {
              const isLC = item.isLifecycle;
              const cropDisplayName = item.crop_name || item.cropName;
              const statusDisplay = getStatusDisplay(item.status);
              const pct = isLC ? 100 : Math.max(0, Math.min(100, (item.remaining_days / item.shelf_life_days) * 100));

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-3xl card-3d hover-3d relative group flex flex-col"
                >
                  {/* Subtle Background Icon */}
                  <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                    <Package className="w-32 h-32" />
                  </div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      {item.images && item.images.length > 0 ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden object-cover border border-border">
                          <img src={item.images[0]} alt={cropDisplayName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLC ? 'bg-success/10' : statusDisplay.bg + '/10'}`}>
                          <Package className={`w-6 h-6 ${isLC ? 'text-success' : statusDisplay.color}`} />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                          {cropDisplayName}
                          <button
                            onClick={() => {
                              setSelectedItemForSale(item);
                              setSellForm({ quantity: '', unit: 'kg', price: '', pricePerQuintal: '', source: 'Market', notes: '' });
                              setShowSellModal(true);
                              setError(null);
                            }}
                            className="px-3 py-1 rounded-lg bg-success text-white hover:bg-success/90 transition-colors font-bold text-xs shadow-sm"
                          >
                            Complete Selling
                          </button>
                          {!isLC && item.crop_plan_id && (
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] uppercase tracking-wider">Linked</span>
                          )}
                        </h3>
                      </div>
                    </div>
                    
                    {!isLC && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedItemForEdit(item);
                            setForm({
                              crop_name: item.crop_name,
                              quantity: item.quantity.toString(),
                              unit: item.unit || 'kg',
                              price_per_kg: item.price_per_kg?.toString() || '',
                              price_per_quintal: item.price_per_quintal?.toString() || '',
                              total_investment: item.total_investment?.toString() || '',
                              harvest_date: item.harvest_date ? new Date(item.harvest_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                              images: item.images || []
                            });
                            setShowEditModal(true);
                            setError(null);
                          }}
                          className="p-2 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/10"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-lg bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-colors border border-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Investment card for lifecycle and manual investment crops */}
                  {(isLC || (item.total_investment > 0)) && (
                    <div className="mb-4 p-4 rounded-xl bg-warning/5 border border-warning/20 relative z-10">
                      <p className="text-xs text-warning font-bold uppercase tracking-wider mb-1">Total Investment</p>
                      <p className="text-2xl font-display font-black text-warning">₹{(item.totalExpense || item.total_investment || 0).toLocaleString()}</p>
                      {item.plantDate && (
                        <p className="text-xs text-muted-foreground mt-1">Growing since {new Date(item.plantDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-6 relative z-10">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Quantity</p>
                      <p className="font-display font-bold text-lg text-foreground">{item.quantity} {item.unit || 'kg'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Harvest Date</p>
                      <p className="font-semibold text-foreground text-base">
                        {new Date(item.harvest_date || item.harvestDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Shelf Life</p>
                      <p className="font-semibold text-foreground text-base">{item.shelf_life_days} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Price</p>
                      <p className="font-semibold text-foreground text-base">
                        {item.price_per_kg > 0 ? `₹${item.price_per_kg}/kg` : ''}
                        {item.price_per_kg > 0 && item.price_per_quintal > 0 ? ' | ' : ''}
                        {item.price_per_quintal > 0 ? `₹${item.price_per_quintal}/Quintal` : ''}
                        {item.price_per_kg <= 0 && (!item.price_per_quintal || item.price_per_quintal <= 0) ? 'N/A' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Days Passed</p>
                      <p className="font-semibold text-foreground text-base">{item.days_passed} days</p>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <statusDisplay.icon className={`w-4 h-4 ${statusDisplay.color}`} />
                        <span className={`text-sm font-bold ${statusDisplay.color}`}>{statusDisplay.label} Condition</span>
                      </div>
                      <span className={`text-lg font-display font-black ${statusDisplay.color}`}>
                        {item.remaining_days < 0 ? 0 : item.remaining_days} <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Days Left</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${statusDisplay.bg} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Record Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="card-3d w-full max-w-md rounded-3xl shadow-elevated p-6 md:p-8 relative"
              >
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground">Add Harvest Record</h2>
                  <p className="text-muted-foreground text-sm mt-1">Select the crop and quantity to begin monitoring.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleAddSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Crop Name</label>
                    <select
                      value={form.crop_name}
                      onChange={e => setForm({ ...form, crop_name: e.target.value })}
                      className={inputClass}
                      required
                    >
                      {shelfLifeDataset.map(c => <option key={c.crop} value={c.crop}>{c.crop}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Quantity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                        placeholder="e.g. 500"
                        className={`${inputClass} w-1/2`}
                      />
                      <select
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}
                        className={`${inputClass} w-1/2`}
                      >
                        <option value="kg">kg</option>
                        <option value="Quintal">Quintal</option>
                      </select>
                    </div>
                  </div>

                  <div className={`grid gap-4 ${form.unit === 'Quintal' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Price (per kg)</label>
                      <input
                        type="number"
                        value={form.price_per_kg}
                        onChange={e => setForm({ ...form, price_per_kg: e.target.value })}
                        placeholder="₹/kg"
                        className={inputClass}
                      />
                    </div>
                    
                    {form.unit === 'Quintal' && (
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Price (per Quintal)</label>
                        <input
                          type="number"
                          value={form.price_per_quintal}
                          onChange={e => setForm({ ...form, price_per_quintal: e.target.value })}
                          placeholder="₹/Quintal"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Harvest Date</label>
                    <input
                      type="date"
                      required
                      value={form.harvest_date}
                      onChange={e => setForm({ ...form, harvest_date: e.target.value })}
                      className={inputClass}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Total Investment / Expense (₹)</label>
                    <input
                      type="number"
                      required
                      value={form.total_investment}
                      onChange={e => setForm({ ...form, total_investment: e.target.value })}
                      placeholder="e.g. 1500"
                      className={inputClass}
                    />
                    <p className="text-xs text-warning mt-1 font-medium">Required for accurate profit/loss tracking.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Crop Images (Up to 3 optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        const allowedFiles = files.slice(0, 3 - form.images.length); // Limit to 3 max
                        
                        allowedFiles.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => {
                                // Double check limit
                                if (prev.images.length >= 3) return prev;
                                return { ...prev, images: [...prev.images, reader.result as string] };
                            });
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className={inputClass + ' file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{form.images.length}/3 images selected</p>
                    
                    {form.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {form.images.map((imgUrl, idx) => (
                           <div key={idx} className="h-20 rounded-xl border border-border overflow-hidden relative group">
                             <img src={imgUrl} alt={`Crop preview ${idx}`} className="w-full h-full object-cover" />
                             <button 
                               type="button" 
                               onClick={() => setForm({...form, images: form.images.filter((_, i) => i !== idx)})} 
                               className="absolute top-1 right-1 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 rounded-full text-white"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold button-3d disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Processing...' : 'Save Storage Record'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Record Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="card-3d w-full max-w-md rounded-3xl shadow-elevated p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground">Edit Harvest Record</h2>
                  <p className="text-muted-foreground text-sm mt-1">Update pictures and details for {form.crop_name}.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Crop Name</label>
                    <input
                      type="text"
                      value={form.crop_name}
                      disabled
                      className={inputClass + ' opacity-50 cursor-not-allowed'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Quantity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                        placeholder="e.g. 500"
                        className={`${inputClass} w-1/2`}
                      />
                      <select
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}
                        className={`${inputClass} w-1/2`}
                      >
                        <option value="kg">kg</option>
                        <option value="Quintal">Quintal</option>
                      </select>
                    </div>
                  </div>

                  <div className={`grid gap-4 ${form.unit === 'Quintal' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Price (per kg)</label>
                      <input
                        type="number"
                        value={form.price_per_kg}
                        onChange={e => setForm({ ...form, price_per_kg: e.target.value })}
                        placeholder="₹/kg"
                        className={inputClass}
                      />
                    </div>
                    
                    {form.unit === 'Quintal' && (
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Price (per Quintal)</label>
                        <input
                          type="number"
                          value={form.price_per_quintal}
                          onChange={e => setForm({ ...form, price_per_quintal: e.target.value })}
                          placeholder="₹/Quintal"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Harvest Date</label>
                    <input
                      type="date"
                      required
                      value={form.harvest_date}
                      onChange={e => setForm({ ...form, harvest_date: e.target.value })}
                      className={inputClass}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Crop Images (Up to 3)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        const allowedFiles = files.slice(0, 3 - form.images.length);
                        
                        allowedFiles.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => {
                                if (prev.images.length >= 3) return prev;
                                return { ...prev, images: [...prev.images, reader.result as string] };
                            });
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className={inputClass + ' file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{form.images.length}/3 images selected</p>
                    
                    {form.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {form.images.map((imgUrl, idx) => (
                           <div key={idx} className="h-20 rounded-xl border border-border overflow-hidden relative group">
                             <img src={imgUrl} alt={`Crop preview ${idx}`} className="w-full h-full object-cover" />
                             <button 
                               type="button" 
                               onClick={() => setForm({...form, images: form.images.filter((_, i) => i !== idx)})} 
                               className="absolute top-1 right-1 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 rounded-full text-white"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold button-3d disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Updating...' : 'Update Storage Record'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sell Crop Modal */}
        <AnimatePresence>
          {showSellModal && selectedItemForSale && (() => {
            const isLC = selectedItemForSale.isLifecycle;
            const cropName = selectedItemForSale.crop_name || selectedItemForSale.cropName;
            const qty = Number(sellForm.quantity) || 0;
            const priceKg = Number(sellForm.price) || 0;
            const priceQuintal = Number(sellForm.pricePerQuintal) || 0;
            const activePrice = sellForm.unit === 'Quintal' ? (priceQuintal || priceKg * 100) : priceKg;
            
            // For revenue, if manual storage item, they normally enter total amount direct, but we will standardize it
            let revenue = 0;
            if (isLC) {
                revenue = qty * activePrice;
            } else {
               // For manual items we can either use the entered total price, or calculate it if they enter unit price
               revenue = sellForm.price ? Number(sellForm.price) : qty * activePrice;
            }
            
            const investment = isLC ? (selectedItemForSale.totalExpense || 0) : (selectedItemForSale.total_investment || 0);
            const profit = revenue - investment;

            return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="card-3d w-full max-w-md rounded-3xl shadow-elevated p-6 md:p-8 relative"
              >
                <button
                  onClick={() => setShowSellModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground">{isLC ? 'Complete Selling' : 'Sell Harvest'}</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Selling <strong>{cropName}</strong>
                    {!isLC && <> — Available: <strong>{selectedItemForSale.quantity} {selectedItemForSale.unit}</strong></>}
                  </p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {/* Lifecycle: Investment summary */}
                {isLC && (
                  <div className="mb-5 p-4 rounded-xl bg-warning/5 border border-warning/20">
                    <p className="text-xs text-warning font-bold uppercase tracking-wider mb-1">Total Investment (Expenses)</p>
                    <p className="text-xl font-black text-warning">₹{investment.toLocaleString()}</p>
                  </div>
                )}

                {!isLC && (
                  <div className="mb-5 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3 relative z-10">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-primary">This sale will be logged as income for this storage record.</p>
                  </div>
                )}

                <form onSubmit={handleSellSubmit} className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-foreground mb-1.5 flex justify-between items-center pr-2">
                        <span>{isLC ? 'Quantity Harvested' : 'Quantity to Sell'}</span>
                        <select 
                          value={sellForm.unit} 
                          onChange={(e) => setSellForm({ ...sellForm, unit: e.target.value })}
                          className="text-xs bg-muted/50 border border-border rounded px-1.5 py-0.5 font-bold text-primary focus:ring-0 cursor-pointer"
                        >
                          <option value="kg">kg</option>
                          <option value="Quintal">Quintal</option>
                        </select>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={!isLC && sellForm.unit === selectedItemForSale.unit ? selectedItemForSale.quantity : undefined}
                        value={sellForm.quantity}
                        onChange={e => setSellForm({ ...sellForm, quantity: e.target.value })}
                        placeholder="e.g. 500"
                        className={inputClass}
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-foreground mb-1.5 mt-[3px]">
                        {isLC ? 'Selling Price (₹/kg)' : 'Total Sale Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={sellForm.price}
                        onChange={e => setSellForm({ ...sellForm, price: e.target.value })}
                        placeholder={isLC ? '₹ per kg' : 'Total ₹ received'}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {isLC && sellForm.unit === 'Quintal' && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Target Price/Quintal (₹)</label>
                      <input 
                        type="number" 
                        required 
                        min="1"
                        value={sellForm.pricePerQuintal} 
                        onChange={(e) => setSellForm({ ...sellForm, pricePerQuintal: e.target.value })} 
                        className={inputClass} 
                        placeholder="e.g. 4500" 
                      />
                    </div>
                  )}

                  {/* Live Profit Preview for lifecycle crops */}
                  {isLC && qty > 0 && activePrice > 0 && (
                    <div className={`p-4 rounded-xl border ${profit >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Investment</p>
                          <p className="text-sm font-bold text-warning">₹{investment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Revenue</p>
                          <p className="text-sm font-bold text-info">₹{revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Profit</p>
                          <p className={`text-sm font-black ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profit >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {profit >= 0 ? '✅ Profitable Crop' : '❌ Failed Crop'}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isLC && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Sale Destination</label>
                        <select value={sellForm.source} onChange={e => setSellForm({ ...sellForm, source: e.target.value })} className={inputClass}>
                          <option value="Market">Local Market</option>
                          <option value="Mandi">Mandi</option>
                          <option value="Direct Buyer">Direct Buyer</option>
                          <option value="AgroVision Buyer">AgroVision Marketplace</option>
                          <option value="Processor">Factory/Processor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Notes (Optional)</label>
                        <input type="text" value={sellForm.notes} onChange={e => setSellForm({ ...sellForm, notes: e.target.value })} placeholder="e.g. Sold to ABC Traders" className={inputClass} />
                      </div>
                    </>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-xl bg-success text-white hover:bg-success/90 font-bold shadow-lg shadow-success/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Processing...' : (isLC ? 'Complete & Calculate Profit' : 'Confirm Sale')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
            );
          })()}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
