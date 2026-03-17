import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Search, X, Send, Package, MapPin, Calendar, Clock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Crop {
  _id: string;
  farmer: { _id: string; name: string; email: string; location?: string };
  crop_name: string;
  quantity: number;
  unit: string;
  price_per_kg: number;
  price_per_quintal: number;
  harvest_date: string;
  shelf_life_days: number;
  days_passed: number;
  remaining_days: number;
  status: string;
  images?: string[];
}

interface MyRequest {
  _id: string;
  farmerId: { name: string };
  cropName: string;
  quantityRequested: number;
  offeredPrice: number;
  counterPrice: number | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Create a map to track which image index is currently being viewed for each crop card
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  
  // State for full-screen image viewing
  const [fullScreenCrop, setFullScreenCrop] = useState<{ cropId: string; index: number } | null>(null);

  const [selectedState, setSelectedState] = useState('all');
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [form, setForm] = useState({
    quantityRequested: '',
    offeredPrice: '',
    message: ''
  });

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleAcceptRequest = async (requestId: string) => {
    if (!window.confirm(t('marketplace.acceptConfirm') || 'Are you sure you want to accept this offer?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/request/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Offer accepted! Order created.');
        fetchMyRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to accept counter offer');
      }
    } catch (error) {
      console.error('Error accepting counter offer', error);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedRequest) return;
    setSendingMsg(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/request/${selectedRequest._id}/message`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: replyText })
      });
      if (res.ok) {
        setReplyText('');
        fetchMyRequests();
        setShowMsgModal(false);
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSendingMsg(false);
    }
  };

  const getToken = () => {
    const str = localStorage.getItem('agrovision_user');
    if (!str) return null;
    return JSON.parse(str)?.token;
  };

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/crops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCrops(data);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace crops', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch my requests', error);
    }
  };

  useEffect(() => {
    fetchCrops();
    fetchMyRequests();
  }, []);

  const handleRequestCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setForm({ 
      quantityRequested: '', 
      offeredPrice: (crop.price_per_kg || (crop.price_per_quintal / 100) || '').toString(), 
      message: '' 
    });
    setShowRequestModal(true);
    setSuccessMsg('');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropId: selectedCrop._id,
          farmerId: selectedCrop.farmer._id,
          cropName: selectedCrop.crop_name,
          quantityRequested: Number(form.quantityRequested),
          offeredPrice: Number(form.offeredPrice),
          message: form.message
        })
      });

      if (res.ok) {
        setShowRequestModal(false);
        setSuccessMsg(t('marketplace.requestModal.success'));
        fetchMyRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.message || t('marketplace.requestModal.fail'));
      }
    } catch (error) {
      console.error('Failed to submit request', error);
      alert('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCrops = crops.filter(c => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      c.crop_name.toLowerCase().includes(searchLower) ||
      c.farmer?.name?.toLowerCase().includes(searchLower) ||
      (c.farmer?.location && c.farmer.location.toLowerCase().includes(searchLower));
    
    const matchesState = selectedState === 'all' || 
      (c.farmer?.location && c.farmer.location.includes(selectedState));

    return matchesSearch && matchesState;
  });

  const isOwnCrop = (crop: Crop) => {
    return user?._id === crop.farmer?._id;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      countered: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getShelfBadge = (status: string) => {
    if (status === 'CRITICAL') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (status === 'WARNING') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-success/10 text-success border-success/20';
  };

  const getFreshness = (crop: Crop) => {
    const pct = crop.shelf_life_days > 0 ? Math.max(0, Math.min(100, Math.round((crop.remaining_days / crop.shelf_life_days) * 100))) : 0;
    let label = t('marketplace.freshnessLabels.fresh');
    let color = 'text-emerald-600';
    let bg = 'bg-emerald-500';
    let badgeBg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (pct < 40) {
      label = t('marketplace.freshnessLabels.urgent');
      color = 'text-red-600';
      bg = 'bg-red-500';
      badgeBg = 'bg-red-100 text-red-700 border-red-200';
    } else if (pct < 70) {
      label = t('marketplace.freshnessLabels.moderate');
      color = 'text-amber-600';
      bg = 'bg-amber-500';
      badgeBg = 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return { pct, label, color, bg, badgeBg };
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  const activeFullScreenCropData = fullScreenCrop ? crops.find(c => c._id === fullScreenCrop.cropId) : null;
  const activeImages = activeFullScreenCropData?.images || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Success Message */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-center gap-3 font-medium">
              <CheckCircle className="w-5 h-5" /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{t('marketplace.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t('marketplace.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowMyRequests(!showMyRequests); if (!showMyRequests) fetchMyRequests(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-all font-medium text-sm card-3d hover-3d"
            >
              <Send className="w-4 h-4" /> {t('marketplace.myRequests', { count: myRequests.length })}
            </button>
          </div>
        </div>

        {/* My Requests Panel */}
        <AnimatePresence>
          {showMyRequests && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground">{t('marketplace.myPurchaseRequests')}</h3>
                <button onClick={() => setShowMyRequests(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              {myRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t('marketplace.noRequests')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.farmer')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.crop')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.qty')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.yourPrice')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.counter')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.status')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.date')}</th>
                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{t('marketplace.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myRequests.map(r => (
                        <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-foreground">{r.farmerId?.name || t('common.unknown') || 'N/A'}</td>
                          <td className="px-5 py-3 text-foreground">{r.cropName}</td>
                          <td className="px-5 py-3 text-foreground">{r.quantityRequested} kg</td>
                          <td className="px-5 py-3 text-foreground">₹{r.offeredPrice}/kg</td>
                          <td className="px-5 py-3 text-foreground">{r.counterPrice ? `₹${r.counterPrice}/kg` : '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border capitalize ${getStatusBadge(r.status)}`}>
                              {t(`common.status.${r.status}`)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3 flex gap-2">
                            {r.status === 'countered' && (
                              <button
                                onClick={() => handleAcceptRequest(r._id)}
                                className="px-3 py-1 bg-success text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                              >
                                {t('marketplace.acceptCounter')}
                              </button>
                            )}
                            {(r.status === 'pending' || r.status === 'countered') && (
                                <button
                                    onClick={() => {
                                        setSelectedRequest(r);
                                        setShowMsgModal(true);
                                    }}
                                    className="px-3 py-1 bg-info text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                                >
                                    {t('marketplace.message')}
                                </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('marketplace.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <div className="md:w-64">
             <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-3 rounded-2xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="all">All States (National)</option>
                {indianStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
          </div>
        </div>

        {/* Crop Listings */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading marketplace...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="text-center py-20 card-3d rounded-3xl border-dashed">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground">{t('marketplace.noCrops')}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {search ? t('marketplace.noCropsSearch') : t('marketplace.noCropsListed')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCrops.map((crop, i) => {
              const freshness = getFreshness(crop);
              return (
              <motion.div
                key={crop._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-3d hover-3d rounded-2xl p-5 group relative flex flex-col"
              >
                {/* Background decoration */}
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                  <Package className="w-24 h-24" />
                </div>

                {/* Crop Name & Freshness Badge */}
                <div className="flex items-start justify-between mb-2 relative z-10">
                  <div className="flex flex-col gap-3 flex-1 w-full mr-3">
                    <div className="flex items-center gap-3">
                        {crop.images && crop.images.length > 0 ? (
                            <div 
                              className="w-16 h-16 rounded-xl overflow-hidden relative border border-border group/img shrink-0 cursor-pointer"
                              onClick={() => {
                                 const currentIdx = imageIndexes[crop._id] || 0;
                                 setFullScreenCrop({ cropId: crop._id, index: currentIdx });
                              }}
                            >
                              <img src={crop.images[imageIndexes[crop._id] || 0]} alt={crop.crop_name} className="w-full h-full object-cover transition-opacity hover:opacity-90" />
                              
                              {/* Left/Right controls if > 1 image */}
                              {crop.images.length > 1 && (
                                <>
                                  <button 
                                     title="Previous Image"
                                     onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setImageIndexes(prev => ({
                                          ...prev,
                                          [crop._id]: prev[crop._id] ? prev[crop._id] - 1 : crop.images!.length - 1
                                        }));
                                     }}
                                     className="absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-[10px]"
                                  >
                                    ‹
                                  </button>
                                  <button 
                                     title="Next Image"
                                     onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setImageIndexes(prev => ({
                                          ...prev,
                                          [crop._id]: prev[crop._id] !== undefined ? (prev[crop._id] + 1) % crop.images!.length : 1
                                        }));
                                     }}
                                     className="absolute right-0.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-[10px]"
                                  >
                                    ›
                                  </button>
                                  {/* Dots indicator */}
                                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                                    {crop.images.map((_, i) => (
                                      <div key={i} className={`w-1 h-1 rounded-full ${i === (imageIndexes[crop._id] || 0) ? 'bg-white' : 'bg-white/40'}`} />
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                        ) : (
                            <div className="w-16 h-16 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-border/50">
                              <Package className="w-6 h-6" />
                            </div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className="font-display font-bold text-lg text-foreground truncate">{crop.crop_name}</h3>
                          <div className="flex flex-col">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" /> {crop.farmer?.location || 'Not specified'}
                            </p>
                            {/* Price display */}
                            {(crop.price_per_kg > 0 || crop.price_per_quintal > 0) && (
                              <p className="text-sm font-bold text-primary mt-0.5">
                                ₹{crop.price_per_kg > 0 ? `${crop.price_per_kg}/kg` : `${crop.price_per_quintal}/Quintal`}
                              </p>
                            )}
                          </div>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border h-fit shrink-0 ${freshness.badgeBg}`}>
                    {freshness.label}
                  </span>
                </div>

                {/* Freshness Indicator */}
                <div className="mb-4 relative z-10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('marketplace.freshness')}</span>
                    <span className={`text-sm font-display font-black ${freshness.color}`}>{freshness.pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${freshness.pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${freshness.bg} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('marketplace.daysRemaining', { remaining: crop.remaining_days, total: crop.shelf_life_days })}</p>
                </div>

                {/* Urgent Sell Alert */}
                {freshness.pct < 40 && (
                  <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 relative z-10">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">⚠ {t('marketplace.urgentSell')}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-5 relative z-10">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-0.5">{t('marketplace.table.farmer')}</p>
                    <p className="font-semibold text-foreground truncate">{crop.farmer?.name || 'Unknown'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-0.5">{t('marketplace.table.qty')}</p>
                    <p className="font-semibold text-foreground">{crop.quantity} {crop.unit}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-0.5">{t('shelf.harvest')}</p>
                    <p className="font-semibold text-foreground">
                      {new Date(crop.harvest_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-0.5">Days After</p>
                    <p className="font-semibold text-foreground">{crop.days_passed} days</p>
                  </div>
                </div>

                {/* Request Button */}
                {isOwnCrop(crop) ? (
                  <div className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm flex items-center justify-center gap-2 relative z-10 mt-auto border border-border/50">
                    <Package className="w-4 h-4" /> {t('marketplace.yourListing') || 'Your Listing'}
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequestCrop(crop)}
                    className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm button-3d flex items-center justify-center gap-2 relative z-10 mt-auto"
                  >
                    <ShoppingCart className="w-4 h-4" /> {t('marketplace.requestCrop')}
                  </button>
                )}
              </motion.div>
              );
            })}
          </div>
        )}

        {/* Request Crop Modal */}
        <AnimatePresence>
          {showRequestModal && selectedCrop && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="card-3d w-full max-w-md rounded-3xl shadow-elevated p-6 md:p-8 relative"
              >
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground">{t('marketplace.requestModal.title')}</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t('marketplace.requestModal.subtitle', { crop: selectedCrop.crop_name, farmer: selectedCrop.farmer?.name || 'Unknown' })}
                  </p>
                  <p className="font-bold text-primary mt-2">
                    {t('marketplace.askingPrice') || 'Farmer\'s Price'}: ₹{selectedCrop.price_per_kg > 0 ? `${selectedCrop.price_per_kg}/kg` : `${selectedCrop.price_per_quintal}/Quintal`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('marketplace.requestModal.available', { qty: selectedCrop.quantity, days: selectedCrop.remaining_days })}</p>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{t('marketplace.requestModal.qtyLabel')} (kg)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedCrop.unit === 'Quintal' ? selectedCrop.quantity * 100 : selectedCrop.quantity}
                      value={form.quantityRequested}
                      onChange={e => setForm({ ...form, quantityRequested: e.target.value })}
                      placeholder={t('marketplace.requestModal.qtyPlaceholder', { qty: selectedCrop.unit === 'Quintal' ? selectedCrop.quantity * 100 : selectedCrop.quantity })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{t('marketplace.requestModal.priceLabel')}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.offeredPrice}
                      onChange={e => setForm({ ...form, offeredPrice: e.target.value })}
                      placeholder="e.g. 25"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{t('marketplace.requestModal.messageLabel')}</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="e.g. Can you sell for ₹23/kg?"
                      rows={3}
                      className={inputClass + " resize-none"}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold button-3d shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> {t('marketplace.requestModal.sending')}</>
                      ) : (
                        <><Send className="w-5 h-5" /> {t('marketplace.requestModal.submit')}</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Message Reply Modal */}
      <AnimatePresence>
        {showMsgModal && selectedRequest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-3d w-full max-w-md rounded-2xl p-6 relative">
              <button onClick={() => setShowMsgModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold mb-2">Conversation: {selectedRequest.cropName}</h3>
              <div className="bg-muted p-3 rounded-xl max-h-40 overflow-y-auto mb-4 text-sm whitespace-pre-wrap font-mono">
                {selectedRequest.message || "No messages yet."}
              </div>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] mb-4"
              />
              <button 
                onClick={handleSendMessage}
                disabled={sendingMsg || !replyText.trim()}
                className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                {sendingMsg ? 'Sending...' : 'Send Message'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-screen Image Modal */}
      <AnimatePresence>
        {fullScreenCrop && activeFullScreenCropData && activeImages.length > 0 && (
          <motion.div 
             key="fullscreen-modal"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
             onClick={() => setFullScreenCrop(null)}
          >
             <button 
                onClick={(e) => { e.stopPropagation(); setFullScreenCrop(null); }}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
             >
                <X className="w-6 h-6" />
             </button>

             {/* Left Navigation */}
             {activeImages.length > 1 && (
                 <button
                     onClick={(e) => {
                         e.stopPropagation();
                         setFullScreenCrop(prev => prev ? { 
                             ...prev, 
                             index: prev.index === 0 ? activeImages.length - 1 : prev.index - 1 
                         } : null);
                     }}
                     className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                 >
                     <span className="text-2xl leading-none">‹</span>
                 </button>
             )}

             <motion.div
                key={fullScreenCrop.index}
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={{ duration: 0.2 }}
                className="max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing it
             >
                 <img 
                    src={activeImages[fullScreenCrop.index]} 
                    alt="Full screen crop preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                 />
                 
                 {/* Dots indicator */}
                 {activeImages.length > 1 && (
                     <div className="flex justify-center gap-2 mt-4">
                     {activeImages.map((_, i) => (
                         <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === fullScreenCrop.index ? 'bg-white' : 'bg-white/30'}`} />
                     ))}
                     </div>
                 )}
             </motion.div>

             {/* Right Navigation */}
             {activeImages.length > 1 && (
                 <button
                     onClick={(e) => {
                         e.stopPropagation();
                         setFullScreenCrop(prev => prev ? { 
                             ...prev, 
                             index: (prev.index + 1) % activeImages.length
                         } : null);
                     }}
                     className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                 >
                     <span className="text-2xl leading-none">›</span>
                 </button>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
