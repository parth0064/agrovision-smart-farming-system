import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Menu, X, Sun, Moon, Globe, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  variant?: 'landing' | 'dashboard';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
    setLangOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="AgroVision Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-lg text-foreground">AgroVision</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {variant === 'landing' && (
            <>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.features')}</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.about')}</a>
            </>
          )}
          {user && variant === 'dashboard' && (
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.dashboard')}</Link>
          )}

          {/* Language */}
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg bg-card shadow-elevated border border-border p-1">
                {[['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']].map(([code, label]) => (
                  <button key={code} onClick={() => changeLang(code)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${i18n.language === code ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground hover:bg-accent'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/settings" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{user.name}</span>
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-accent transition-colors">{t('nav.login')}</Link>
              <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">{t('nav.register')}</Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden glass-strong border-t border-border">
            <div className="p-4 flex flex-col gap-3">
              {variant === 'landing' && (
                <>
                  <a href="#features" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-foreground">{t('landing.features')}</a>
                  <a href="#about" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-foreground">{t('landing.about')}</a>
                </>
              )}
              {user && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-foreground">{t('nav.dashboard')}</Link>}
              <div className="flex gap-2">
                {[['en', 'EN'], ['hi', 'HI'], ['mr', 'MR']].map(([code, label]) => (
                  <button key={code} onClick={() => changeLang(code)} className={`px-3 py-1 rounded-md text-xs ${i18n.language === code ? 'gradient-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={toggle} className="flex items-center gap-2 py-2 text-sm text-foreground">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              {user ? (
                <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }} className="py-2 text-sm text-destructive">{t('nav.logout')}</button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2 text-center text-sm font-medium rounded-lg bg-accent text-accent-foreground">{t('nav.login')}</Link>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2 text-center text-sm font-medium rounded-lg gradient-primary text-primary-foreground">{t('nav.register')}</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
