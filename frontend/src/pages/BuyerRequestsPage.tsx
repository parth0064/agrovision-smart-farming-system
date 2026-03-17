import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Inbox,
  Check,
  X,
  MessageSquare,
  Package,
  ArrowRight,
  TrendingUp,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ShoppingBag,
  Loader2,
  DollarSign
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface BuyerRequest {
  _id: string;
  buyerId: { _id: string; name: string; email: string };
  cropId: string;
  cropName: string;
  quantityRequested: number;
  offeredPrice: number;
  counterPrice: number | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: string;
}

export default function BuyerRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'countered'>('all');
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BuyerRequest | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const getToken = () => {
    const str = localStorage.getItem('agrovision_user');
    if (!str) return null;
    return JSON.parse(str)?.token;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/farmer/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch buyer requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
    if (!window.confirm(t(action === 'accept' ? 'buyerRequests.acceptConfirm' : 'buyerRequests.rejectConfirm'))) return;

    setActionLoading(requestId);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/request/${requestId}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error during ${action}`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setActionLoading(selectedRequest._id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/marketplace/request/${selectedRequest._id}/counter`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ counterPrice: Number(counterPrice) })
      });

      if (res.ok) {
        setShowCounterModal(false);
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to send counter offer');
      }
    } catch (error) {
      console.error('Error during counter offer', error);
    } finally {
      setActionLoading(null);
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
        fetchRequests();
        setShowMsgModal(false);
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSendingMsg(false);
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      countered: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const stats = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    countered: requests.filter(r => r.status === 'countered').length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Inbox className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">{t('buyerRequests.title')}</h1>
              {stats.pending > 0 && (
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full animate-pulse shadow-lg shadow-primary/20">
                  {t('buyerRequests.newBadge', { count: stats.pending })}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-lg">{t('buyerRequests.subtitle')}</p>
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex p-1.5 bg-card rounded-2xl border border-border shadow-sm overflow-x-auto no-scrollbar">
            {(['all', 'pending', 'accepted', 'rejected', 'countered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t(`buyerRequests.filter${f.charAt(0).toUpperCase() + f.slice(1)}`, { count: stats[f] })}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-12 h-12 text-primary/30 mx-auto mb-6 animate-spin" />
            <p className="text-muted-foreground text-lg">Fetching buyer requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 rounded-[2.5rem] bg-card border border-dashed border-border flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">{t('buyerRequests.noRequests')}</h3>
            <p className="text-muted-foreground max-w-md">
              {filter === 'all'
                ? t('buyerRequests.noRequestsDesc')
                : t('buyerRequests.noFilteredRequests', { filter: filter })}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((req, i) => (
                <motion.div
                  key={req._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-3xl card-3d overflow-hidden flex flex-col border border-border/50 hover:border-primary/50 group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${getStatusBadge(req.status)}`}>
                        {t(`common.status.${req.status}`)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                          {req.cropName} <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50" /> {req.quantityRequested} kg
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground font-medium">
                          <User className="w-4 h-4" /> {t('buyerRequests.card.buyer')}: {req.buyerId.name}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('buyerRequests.card.price')}</p>
                          <p className="text-lg font-display font-black text-foreground">₹{req.offeredPrice}/kg</p>
                        </div>
                        {req.counterPrice && (
                          <div className="flex flex-col items-end">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Counter</p>
                            <p className="text-lg font-display font-black text-blue-600">₹{req.counterPrice}/kg</p>
                          </div>
                        )}
                      </div>

                      {req.message && (
                        <div className="p-4 rounded-2xl bg-muted/50 text-sm text-foreground/80 italic flex gap-3">
                          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p>"{req.message}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="p-6 pt-0 mt-auto flex gap-3">
                      <button
                        onClick={() => handleAction(req._id, 'accept')}
                        className="flex-1 py-3 rounded-xl bg-success text-white font-bold text-xs button-3d flex items-center justify-center gap-2"
                        disabled={actionLoading === req._id}
                      >
                        {actionLoading === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {t('buyerRequests.card.accept')}
                      </button>
                      <button
                        onClick={() => { setSelectedRequest(req); setCounterPrice(req.offeredPrice.toString()); setShowCounterModal(true); }}
                        className="flex-1 py-3 rounded-xl bg-info text-white font-bold text-xs button-3d flex items-center justify-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        {t('buyerRequests.card.counterBtn')}
                      </button>
                      <button
                        onClick={() => handleAction(req._id, 'reject')}
                        className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all button-3d"
                        disabled={actionLoading === req._id}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedRequest(req); setReplyText(''); setShowMsgModal(true); }}
                        className="p-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all button-3d"
                        title={t('marketplace.message')}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {req.status === 'countered' && (
                      <div className="p-6 pt-0 mt-auto flex gap-3">
                          <div className="flex-1 py-3 px-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Waiting for Buyer
                          </div>
                          <button
                            onClick={() => { setSelectedRequest(req); setReplyText(''); setShowMsgModal(true); }}
                            className="px-4 py-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all button-3d flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                      </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Counter Offer Modal */}
        <AnimatePresence>
          {showCounterModal && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-[2.5rem] bg-card border border-border shadow-elevated p-8 relative overflow-hidden"
              >
                {/* Modal Background Decor */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">{t('buyerRequests.counterModal.title')}</h2>
                <p className="text-muted-foreground mb-8 text-sm">
                  {t('buyerRequests.counterModal.desc', { buyer: selectedRequest.buyerId.name, crop: selectedRequest.cropName, qty: selectedRequest.quantityRequested, price: selectedRequest.offeredPrice })}
                </p>

                <form onSubmit={handleCounterOffer} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('buyerRequests.counterModal.inputLabel')}</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="number"
                        required
                        value={counterPrice}
                        onChange={e => setCounterPrice(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-display font-bold text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCounterModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all border border-border"
                    >
                      {t('buyerRequests.counterModal.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === selectedRequest._id}
                      className="flex-1 py-4 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 button-3d flex items-center justify-center gap-2"
                    >
                      {actionLoading === selectedRequest._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                      {t('buyerRequests.counterModal.send')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Message Reply Modal */}
        <AnimatePresence>
          {showMsgModal && selectedRequest && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-3d w-full max-w-md rounded-[2.5rem] bg-card border border-border p-8 relative">
                <button onClick={() => setShowMsgModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Conversation: {selectedRequest.cropName}</h3>
                </div>
                
                <div className="bg-muted p-4 rounded-2xl max-h-40 overflow-y-auto mb-6 text-sm whitespace-pre-wrap font-mono border border-border">
                  {selectedRequest.message || "No messages yet."}
                </div>
                
                <div className="space-y-2 mb-6">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Your Reply</label>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full p-4 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px]"
                  />
                </div>

                <button 
                  onClick={handleSendMessage}
                  disabled={sendingMsg || !replyText.trim()}
                  className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 button-3d flex items-center justify-center gap-2"
                >
                  {sendingMsg ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                  Send Message
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
