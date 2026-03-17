import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { MessageCircle, MessageSquare, User, Calendar, Plus, X, ArrowLeft, Search, Filter, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FarmerTalkPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  
  // New Question Form state
  const [showAskModal, setShowAskModal] = useState(false);
  const [askForm, setAskForm] = useState({ title: '', description: '', cropType: 'General' });
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Filters
  const [filterCrop, setFilterCrop] = useState('All');
  const [sortOrder, setSortOrder] = useState('latest');
  
  // Detail View State
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Reply Form state
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Common crops for filter & form
  const cropCategories = ['All', 'General', 'Wheat', 'Rice', 'Maize', 'Soybean', 'Cotton', 'Sugarcane', 'Tomato', 'Potato', 'Onion', 'Fruits', 'Vegetables'];
  
  const getToken = () => {
    const str = localStorage.getItem('agrovision_user');
    if (!str) return null;
    return JSON.parse(str)?.token;
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/farmer-talk/questions?crop=${filterCrop === 'All' ? 'All' : filterCrop}&sort=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch forum questions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewState === 'list') {
      fetchQuestions();
    }
  }, [viewState, filterCrop, sortOrder]);

  const loadQuestionDetail = async (questionId: string) => {
    setLoadingDetail(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/farmer-talk/question/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedQuestion(data.question);
        setReplies(data.replies);
        setViewState('detail');
      }
    } catch (error) {
      console.error('Failed to load question details', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askForm.title || !askForm.description) return;
    
    setSubmittingQuestion(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/farmer-talk/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionTitle: askForm.title,
          questionDescription: askForm.description,
          cropType: askForm.cropType,
          farmerName: user?.name
        })
      });

      if (res.ok) {
        setShowAskModal(false);
        setAskForm({ title: '', description: '', cropType: 'General' });
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error posting question', error);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedQuestion) return;

    setSubmittingReply(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/farmer-talk/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: selectedQuestion._id,
          answerText: replyText,
          farmerName: user?.name
        })
      });

      if (res.ok) {
        setReplyText('');
        // Reload details to get new reply
        loadQuestionDetail(selectedQuestion._id);
      }
    } catch (error) {
      console.error('Error posting reply', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 md:p-8 rounded-3xl shadow-elevated border border-border relative overflow-hidden">
          {/* Subtle Graphic */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-2 flex items-center gap-3">
              <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              {t('farmerTalk.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {t('farmerTalk.subtitle')}
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            {viewState === 'list' ? (
              <button 
                onClick={() => setShowAskModal(true)}
                className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold button-3d flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> {t('farmerTalk.askBtn')}
              </button>
            ) : (
              <button 
                onClick={() => setViewState('list')}
                className="px-6 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> {t('farmerTalk.backBtn')}
              </button>
            )}
          </div>
        </div>

        {viewState === 'list' && (
          <>
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground w-full sm:w-auto font-medium">
                <Filter className="w-5 h-5 text-primary" /> {t('farmerTalk.filterBy')}
              </div>
              
              <select 
                value={filterCrop} 
                onChange={e => setFilterCrop(e.target.value)}
                className="w-full sm:w-48 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {cropCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? t('farmerTalk.allCrops') : cat}
                  </option>
                ))}
              </select>

              <select 
                value={sortOrder} 
                onChange={e => setSortOrder(e.target.value)}
                className="w-full sm:w-48 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="latest">{t('farmerTalk.latestQuestions')}</option>
                <option value="replies">{t('farmerTalk.mostReplies')}</option>
              </select>
            </div>

            {/* Questions List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
                <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground">{t('farmerTalk.noQuestions')}</h3>
                <p className="text-muted-foreground mt-2">{t('farmerTalk.noQuestionsDesc')}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {questions.map((q) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={q._id}
                    onClick={() => loadQuestionDetail(q._id)}
                    className="p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
                            {q.cropType}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <User className="w-4 h-4" /> {q.farmerName}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Calendar className="w-4 h-4" /> {t('farmerTalk.postedOn', { date: new Date(q.datePosted).toLocaleDateString() })}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{q.questionTitle}</h3>
                        <p className="text-muted-foreground line-clamp-2">{q.questionDescription}</p>
                      </div>
                      
                      <div className="shrink-0 flex items-center justify-center p-3 rounded-xl bg-muted group-hover:bg-primary/5 transition-colors">
                        <div className="text-center">
                          <span className="block text-2xl font-black text-foreground group-hover:text-primary transition-colors">{q.replyCount}</span>
                          <span className="text-xs uppercase font-bold text-muted-foreground">{t('farmerTalk.replies')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {viewState === 'detail' && selectedQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
             {/* Left Column: Q & A */}
            <div className="space-y-6">
              {/* The Question */}
              <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 text-sm mb-6">
                   <span className="px-3 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
                      {selectedQuestion.cropType} {t('schemes.crop')}
                   </span>
                   <span className="flex items-center gap-1 text-muted-foreground font-medium">
                      <Calendar className="w-4 h-4" /> {t('farmerTalk.postedOn', { date: new Date(selectedQuestion.datePosted).toLocaleString() })}
                   </span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black text-foreground mb-4 leading-tight">{selectedQuestion.questionTitle}</h2>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedQuestion.questionDescription}
                </div>
                
                <div className="mt-6 flex items-center gap-3 pt-6 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                     <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedQuestion.farmerName}</p>
                    <p className="text-xs text-muted-foreground">{t('farmerTalk.farmerAsking')}</p>
                  </div>
                </div>
              </div>

              {/* Replies Section */}
              <div className="flex items-center gap-3 my-8">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">{t('farmerTalk.communityReplies', { count: replies.length })}</h3>
                <div className="h-px bg-border flex-1 ml-4"></div>
              </div>

              {loadingDetail ? (
                 <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
              ) : replies.length === 0 ? (
                 <div className="p-8 text-center bg-card rounded-3xl border border-border border-dashed">
                   <p className="text-muted-foreground font-medium">{t('farmerTalk.noReplies')}</p>
                 </div>
              ) : (
                <div className="space-y-4">
                  {replies.map((reply, index) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={reply._id} className="p-6 bg-card rounded-2xl border border-border shadow-sm flex gap-4">
                      <div className="shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                           <p className="font-bold text-foreground text-sm flex items-center gap-2">
                             {reply.farmerName} 
                             {reply.farmerName === selectedQuestion.farmerName && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">{t('farmerTalk.originalPoster')}</span>}
                           </p>
                           <p className="text-xs text-muted-foreground font-medium">{new Date(reply.datePosted).toLocaleString()}</p>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{reply.answerText}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Write Reply Sticky Form */}
            <div className="relative">
              <div className="sticky top-24 p-6 bg-card rounded-3xl border border-border shadow-elevated">
                 <h3 className="text-lg font-bold text-foreground mb-4">{t('farmerTalk.postReply')}</h3>
                 <form onSubmit={handleReplySubmit} className="space-y-4">
                   <div>
                     <textarea 
                       rows={6}
                       required
                       value={replyText}
                       onChange={e => setReplyText(e.target.value)}
                       placeholder={t('farmerTalk.replyPlaceholder')}
                       className={inputClass + " resize-none"}
                     ></textarea>
                   </div>
                   <button 
                     type="submit" 
                     disabled={submittingReply || !replyText.trim()}
                     className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                   >
                     {submittingReply ? t('farmerTalk.posting') : t('farmerTalk.postReplyBtn')}
                   </button>
                 </form>
                 
                 <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm">
                   <p className="font-bold text-primary flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> {t('farmerTalk.guidelines')}</p>
                   <ul className="text-muted-foreground space-y-1 ml-4 list-disc text-xs">
                     <li>{t('farmerTalk.guide1')}</li>
                     <li>{t('farmerTalk.guide2')}</li>
                     <li>{t('farmerTalk.guide3')}</li>
                   </ul>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* ASK QUESTION MODAL */}
        <AnimatePresence>
          {showAskModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-card rounded-3xl shadow-elevated border border-border p-6 relative">
                <button onClick={() => setShowAskModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-display font-black text-foreground mb-2 flex items-center gap-3">
                  <MessageCircle className="w-7 h-7 text-primary" />
                  {t('farmerTalk.askModalTitle')}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">{t('farmerTalk.askModalDesc')}</p>

                <form onSubmit={handleAskSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{t('farmerTalk.questionTitle')}</label>
                    <input 
                      type="text" 
                      required 
                      value={askForm.title} 
                      onChange={e => setAskForm({ ...askForm, title: e.target.value })} 
                      className={inputClass} 
                      placeholder={t('farmerTalk.placeholderTitle')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{t('farmerTalk.category')}</label>
                    <select 
                      value={askForm.cropType} 
                      onChange={e => setAskForm({ ...askForm, cropType: e.target.value })} 
                      className={inputClass}
                    >
                      {cropCategories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{t('farmerTalk.description')}</label>
                    <textarea 
                      required 
                      rows={5}
                      value={askForm.description} 
                      onChange={e => setAskForm({ ...askForm, description: e.target.value })} 
                      className={inputClass + " resize-none"} 
                      placeholder={t('farmerTalk.placeholderDesc')}
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={submittingQuestion} 
                      className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-black button-3d disabled:opacity-50 text-lg flex justify-center items-center gap-2"
                    >
                      {submittingQuestion ? t('farmerTalk.posting') : t('farmerTalk.postQuestionBtn')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
