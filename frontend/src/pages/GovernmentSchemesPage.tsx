import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ExternalLink, ShieldCheck, Landmark } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Scheme {
  scheme_name: string;
  description: string;
  type: string;
  apply_link: string;
  state: string;
  district: string;
  crop: string;
  loss_type: string;
}

export default function GovernmentSchemesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searched, setSearched] = useState(false);

  const [form, setForm] = useState({
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune',
    crop: 'Wheat',
    loss_type: 'Flood'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schemes/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        setSchemes(data);
        setSearched(true);
      }
    } catch (error) {
      console.error('Failed to find schemes', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <DashboardLayout>
      {/* Dynamic 3D Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="bg-orb-1 opacity-40"></div>
        <div className="bg-orb-2 opacity-40"></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-0">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('schemesPage.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('schemesPage.subtitle')}</p>
        </div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="p-6 md:p-8 rounded-3xl card-3d space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Country</label>
              <input
                className={inputClass}
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">State</label>
              <select
                className={inputClass}
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Bihar">Bihar</option>
                <option value="Other">Other States</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">District</label>
              <input
                className={inputClass}
                placeholder="e.g. Pune"
                value={form.district}
                onChange={e => setForm({ ...form, district: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Crop</label>
              <input
                className={inputClass}
                placeholder="e.g. Wheat"
                value={form.crop}
                onChange={e => setForm({ ...form, crop: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Loss Type</label>
            <select
              className={inputClass}
              value={form.loss_type}
              onChange={e => setForm({ ...form, loss_type: e.target.value })}
            >
              <option value="Flood">Flood</option>
              <option value="Drought">Drought</option>
              <option value="Natural Disaster">Natural Disaster</option>
              <option value="Pest Attack">Pest Attack</option>
              <option value="Low Productivity">Low Productivity</option>
              <option value="Storage Spoilage">Storage Spoilage</option>
              <option value="Financial">Financial</option>
              <option value="All">All / General Interest</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold button-3d disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? t('schemesPage.btnSearching') : t('schemesPage.btnFind')}
          </button>
        </motion.form>

        {/* Results Section */}
        <AnimatePresence>
          {searched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 px-2">
                <ShieldCheck className="w-5 h-5 text-success" />
                <h2 className="text-xl font-bold text-foreground">{schemes.length} {t('schemesPage.schemesAvailable')}</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {schemes.map((s, i) => (
                  <motion.div
                    key={s.scheme_name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group p-6 md:p-8 rounded-3xl card-3d hover-3d transition-all relative overflow-hidden"
                  >
                    {/* Background Icon Decor */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                      <Landmark className="w-24 h-24" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-widest text-primary">{s.type} government</span>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-foreground leading-tight">{s.scheme_name}</h3>
                        <p className="text-muted-foreground leading-relaxed text-base">{s.description}</p>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase">State: {s.state}</span>
                          <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase">District: {s.district}</span>
                          <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase">Crop: {s.crop}</span>
                        </div>
                      </div>

                      <div className="md:border-l border-border md:pl-8 flex flex-col justify-center min-w-[160px]">
                        <a
                          href={s.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold transition-all shadow-sm group/btn"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </a>
                        <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-60">Redirects to official portal</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {searched && schemes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('schemesPage.noSchemes')}</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
