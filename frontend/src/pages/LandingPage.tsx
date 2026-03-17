import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, BarChart3, TrendingUp, Clock, FileText, Bot, ArrowRight, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HeroScene from '@/components/HeroScene';
import heroFarm from '@/assets/hero-farming-scene.jpg';
import farmSectionBg from '@/assets/farm-section-bg.jpg';

const features = [
  { icon: Sprout, key: 'cropPlanning', color: 'text-success' },
  { icon: BarChart3, key: 'priceIntel', color: 'text-info' },
  { icon: TrendingUp, key: 'analytics', color: 'text-primary' },
  { icon: Clock, key: 'shelfLife', color: 'text-warning' },
  { icon: FileText, key: 'govSchemes', color: 'text-secondary' },
  { icon: Bot, key: 'chatbot', color: 'text-primary' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with parallax */}
        <div className="absolute inset-0">
          <img src={heroFarm} alt="Farm landscape" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        </div>

        {/* 3D Scene */}
        <HeroScene />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium text-foreground mb-6">
              <Sprout className="w-4 h-4 text-primary" />
              Intelligent Farm Planning
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
            <span className="gradient-text">{t('hero.headline')}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-muted-foreground">
            {t('hero.subheadline')}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')}
              className="group px-8 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg shadow-elevated hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={farmSectionBg} alt="Terraced fields" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">{t('features.title')}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('features.subtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30 shadow-card hover:shadow-elevated hover:bg-card/70 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-accent/60 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t(`cards.${f.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`cards.${f.key}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroFarm} alt="Farming community" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">Why AgroVision?</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              AgroVision combines artificial intelligence with agricultural expertise to empower farmers with data-driven decisions. From crop selection to market timing, we help maximize your returns while minimizing risk.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { num: '10K+', label: 'Active Farmers' },
                { num: '95%', label: 'Prediction Accuracy' },
                { num: '₹2Cr+', label: 'Savings Generated' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30 shadow-card">
                  <div className="text-3xl font-display font-bold gradient-text mb-1">{stat.num}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 AgroVision. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
