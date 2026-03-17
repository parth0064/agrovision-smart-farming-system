import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Droplets, Thermometer, MapPin, Trash2, X, Plus, Clock, IndianRupee, ShoppingCart, ShoppingBag } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [crops, setCrops] = useState<any[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    cropName: '',
    location: '',
    landSize: '',
    plantDate: new Date().toISOString().slice(0, 10),
    seedQuantity: ''
  });

  // Expense Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ expense_type: 'Seeds', amount: '', notes: '' });
  const [selectedCrop, setSelectedCrop] = useState<any>(null);

  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expenseHistory, setExpenseHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Storage alerts (for stats bar)
  const [storageItems, setStorageItems] = useState<any[]>([]);
  // Buyer orders
  const [orders, setOrders] = useState<any[]>([]);

  const getToken = () => {
    const str = localStorage.getItem('agrovision_user');
    if (!str) return null;
    return JSON.parse(str)?.token;
  };

  // ─── FETCH: Active crops from lifecycle API ───
  const fetchCrops = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lifecycle/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCrops(data);
      }
    } catch (error) {
      console.error('Failed to fetch crops', error);
    } finally {
      setLoadingCrops(false);
    }
  };

  const fetchStorage = async () => {
    if (!user?._id) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/storage/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStorageItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch storage', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = getToken();
      const endpoint = user?.role === 'buyer' ? `${API_URL}/api/marketplace/my-requests` : null;
      if (!endpoint) return;
      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'farmer') {
      fetchCrops();
      fetchStorage();
    } else if (user?.role === 'buyer') {
      fetchOrders();
    }
  }, [user?._id, user?.role]);

  const atRisk = storageItems.filter(item => item.status === 'CRITICAL' || item.status === 'WARNING');
  const alertMsg = atRisk.length > 0
    ? `${atRisk[0].crop_name} ${atRisk[0].status.toLowerCase()}`
    : 'All crops safe';
  const isBuyer = user?.role === 'buyer';

  // ─── HANDLERS ───

  const handleDeleteCrop = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this crop and all its expenses?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lifecycle/active/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCrops(crops.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete crop', error);
    }
  };

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lifecycle/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        await fetchCrops();
        setShowAddModal(false);
        setAddForm({ cropName: '', location: '', landSize: '', plantDate: new Date().toISOString().slice(0, 10), seedQuantity: '' });
      }
    } catch (error) {
      console.error('Failed to add crop', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenAddExpense = (crop: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCrop(crop);
    setShowExpenseModal(true);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;
    setAddingExpense(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lifecycle/active/${selectedCrop._id}/expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        await fetchCrops();
        setShowExpenseModal(false);
        setExpenseForm({ expense_type: 'Seeds', amount: '', notes: '' });
        setSelectedCrop(null);
      }
    } catch (error) {
      console.error('Failed to add expense', error);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleTransferToShelf = async (cropId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Transfer this crop to Shelf Monitoring for selling?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lifecycle/active/${cropId}/transfer`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('✅ Crop transferred to Shelf Monitoring! Go to the Shelf Life page to add sales.');
        fetchCrops();
      }
    } catch (error) {
      console.error('Failed to transfer crop', error);
    }
  };

  const handleViewHistory = async (crop: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCrop(crop);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lifecycle/active/${crop._id}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenseHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <DashboardLayout>
      {/* Dynamic 3D Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="bg-orb-1"></div>
        <div className="bg-orb-2"></div>
      </div>

      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative z-0">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          {t('dashboardPage.welcome')}, {user?.name || (isBuyer ? t('auth.buyer') : t('auth.farmer'))} {isBuyer ? '🤝' : '👋'}
        </h2>
        <p className="text-muted-foreground">{isBuyer ? t('dashboardPage.noNegotiationsDesc') : t('dashboardPage.chooseModule')}</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {(isBuyer ? [
          { label: t('dashboardPage.stats.requested'), value: orders.length.toString(), change: t('dashboardPage.stats.acrossFarmers') },
          { label: t('dashboardPage.stats.negotiations'), value: orders.filter(o => o.status === 'countered').length.toString(), change: t('dashboardPage.stats.actionRequired') },
          { label: t('dashboardPage.stats.deals'), value: orders.filter(o => o.status === 'accepted').length.toString(), change: t('dashboardPage.stats.successBought') },
        ] : [
          { label: t('dashboardPage.activeCrops'), value: crops.length.toString(), change: t('dashboardPage.acrossFields') },
          { label: t('dashboardPage.alerts'), value: atRisk.length.toString(), change: alertMsg === 'All crops safe' ? t('dashboardPage.allSafe') : alertMsg },
          { label: t('dashboardPage.schemes'), value: '4', change: t('dashboardPage.availableNow') },
        ]).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl card-3d hover-3d"
          >
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider relative z-10">{stat.label}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1 relative z-10">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Section */}
      <div className="mb-6 flex items-center justify-between mt-12 relative z-0">
        <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
          {isBuyer ? t('dashboardPage.negotiations') : t('dashboardPage.yourPlantedCrops')}
        </h3>
        {!isBuyer && (
          <button
            className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            + {t('dashboardPage.addNewCrop')}
          </button>
        )}
      </div>

      {isBuyer ? (
        orders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">{t('dashboardPage.noNegotiations')}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">{t('dashboardPage.noNegotiationsDesc')}</p>
            <button onClick={() => navigate('/marketplace')} className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d">
              {t('dashboardPage.visitMarketplace')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8 mt-4 relative z-0">
            {orders.slice(0, 6).map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate('/marketplace')}
                className="p-6 rounded-3xl card-3d hover-3d cursor-pointer flex flex-col group border border-border/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{order.cropName}</h4>
                      <p className="text-xs text-muted-foreground">{t('marketplace.table.farmer')}: {order.farmerId?.name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${
                    order.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                    order.status === 'countered' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {t(`common.status.${order.status}`)}
                  </span>
                </div>
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('marketplace.table.qty')}</span>
                    <span className="font-semibold text-foreground">{order.quantityRequested} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('marketplace.table.yourPrice')}</span>
                    <span className="font-semibold text-foreground">₹{order.offeredPrice}/kg</span>
                  </div>
                  {order.counterPrice && (
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-blue-600 font-bold italic">{t('marketplace.table.counter')}</span>
                      <span className="font-bold text-blue-600">₹{order.counterPrice}/kg</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : loadingCrops ? (
        <p className="text-muted-foreground py-10">{t('dashboardPage.loading')}</p>
      ) : crops.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
          <Sprout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">{t('dashboardPage.noPlantedCrops')}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">{t('dashboardPage.addCurrentToTrack')}</p>
          <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d">
            {t('dashboardPage.addCropManually')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8 mt-4 relative z-0">
          {crops.map((crop, i) => (
            <motion.div
              key={crop._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
              className="p-6 md:p-8 rounded-3xl card-3d hover-3d flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-card to-secondary/5 opacity-50 pointer-events-none" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-success/10">
                    <Sprout className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground tracking-tight">{crop.cropName}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary/70" /> {crop.location || 'Field'} ({crop.landSize} Ac)
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteCrop(crop._id, e)}
                  className="p-2.5 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-colors border border-destructive/10 shadow-sm"
                  title="Delete Crop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 relative z-10 mt-auto">
                {/* Expense bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2.5">
                    <span className="text-muted-foreground font-medium">{t('dashboardPage.expenses')}</span>
                    <span className="font-bold text-warning">₹{(crop.totalExpense || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-secondary/30 rounded-full h-3 overflow-hidden">
                    <div className="bg-warning h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${Math.min(100, ((crop.totalExpense || 0) / 10000) * 100)}%` }}>
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-border/60 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-info" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{t('dashboardPage.planted')}</p>
                      <p className="text-sm font-bold text-foreground">{new Date(crop.plantDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Stage</p>
                      <p className="text-sm font-bold text-success uppercase">{crop.stage || 'Growing'}</p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleOpenAddExpense(crop, e)}
                    className="flex-1 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> {t('dashboardPage.addExpense')}
                  </button>
                  <button
                    onClick={(e) => handleViewHistory(crop, e)}
                    className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs hover:opacity-80 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Clock className="w-3 h-3" /> {t('dashboardPage.viewExpenses')}
                  </button>
                </div>
                <button
                  onClick={(e) => handleTransferToShelf(crop._id, e)}
                  className="w-full py-2.5 rounded-xl bg-success text-white font-bold text-sm hover:bg-success/90 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Transfer to Shelf Monitoring
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ADD CROP MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card-3d w-full max-w-lg rounded-3xl shadow-elevated p-6 md:p-8 relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Add Current Crop</h2>
                  <p className="text-muted-foreground text-sm">Track your crop growth and expenses.</p>
                </div>
              </div>

              <form onSubmit={handleAddCrop} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Crop Name</label>
                  <input type="text" required value={addForm.cropName} onChange={(e) => setAddForm({ ...addForm, cropName: e.target.value })} className={inputClass} placeholder="e.g. Wheat" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Land Size (Acres)</label>
                    <input type="number" step="0.1" required value={addForm.landSize} onChange={(e) => setAddForm({ ...addForm, landSize: e.target.value })} className={inputClass} placeholder="e.g. 5.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Location</label>
                    <input type="text" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} className={inputClass} placeholder="e.g. Field A" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Planting Date</label>
                    <input type="date" required value={addForm.plantDate} onChange={(e) => setAddForm({ ...addForm, plantDate: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Seed Quantity (kg)</label>
                    <input type="number" step="0.1" value={addForm.seedQuantity} onChange={(e) => setAddForm({ ...addForm, seedQuantity: e.target.value })} className={inputClass} placeholder="e.g. 150" />
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-2 relative z-10">
                  <button type="submit" disabled={isAdding} className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d disabled:opacity-50 text-base">
                    {isAdding ? 'Processing...' : 'Save & Track Crop'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD EXPENSE MODAL */}
      <AnimatePresence>
        {showExpenseModal && selectedCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-3d w-full max-w-md rounded-2xl p-6 relative">
              <button
                onClick={() => { setShowExpenseModal(false); setSelectedCrop(null); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-foreground mb-1">Add Expense</h2>
              <p className="text-muted-foreground text-sm mb-2">Recording cost for <strong>{selectedCrop.cropName}</strong></p>
              <p className="text-xs text-warning font-semibold mb-6">Current Total: ₹{(selectedCrop.totalExpense || 0).toLocaleString()}</p>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Expense Type</label>
                  <select value={expenseForm.expense_type} onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })} className={inputClass} required>
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Labor">Labor</option>
                    <option value="Water">Water / Irrigation</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Transport">Transport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="number" required min="1" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={`${inputClass} pl-10`} placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description (Optional)</label>
                  <input type="text" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} className={inputClass} placeholder="e.g. Bought from market" />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={addingExpense} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 shadow-md disabled:opacity-50">
                    {addingExpense ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXPENSE HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && selectedCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-3d w-full max-w-3xl rounded-3xl p-6 md:p-8 relative max-h-[90vh] flex flex-col">
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedCrop(null); }}
                className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 pr-10">
                <h2 className="text-2xl font-display font-bold text-foreground">Expense History</h2>
                <p className="text-muted-foreground text-sm">Reviewing financial records for {selectedCrop.cropName}.</p>
                <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/20 inline-block">
                  <p className="text-sm text-warning font-semibold uppercase tracking-wider mb-1">Total Investment</p>
                  <p className="text-2xl font-bold text-warning">₹{(selectedCrop.totalExpense || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] border border-border rounded-xl">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading records...</p>
                  </div>
                ) : expenseHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full flex-col">
                    <Clock className="w-10 h-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">No expenses recorded yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Date</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Expense Type</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {expenseHistory.map((exp: any, idx: number) => {
                        const d = new Date(exp.date);
                        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-foreground font-medium">{dateStr}</td>
                            <td className="px-4 py-3 text-foreground">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                {exp.expense_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-foreground">₹{(exp.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">{exp.notes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
