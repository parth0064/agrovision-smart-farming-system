import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Moon, Sun, User, LogOut } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };

  return (
    <DashboardLayout>
      {/* Dynamic 3D Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="bg-orb-1 opacity-20"></div>
        <div className="bg-orb-2 opacity-20"></div>
      </div>

      <div className="max-w-xl mx-auto space-y-4 relative z-0">
        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl card-3d hover-3d">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t('settings.language')}</h3>
          </div>
          <div className="flex gap-2">
            {[['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']].map(([code, label]) => (
              <button key={code} onClick={() => changeLang(code)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${i18n.language === code ? 'gradient-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}>
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dark mode */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl card-3d hover-3d">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <h3 className="font-semibold text-foreground">{t('settings.darkMode')}</h3>
            </div>
            <button onClick={toggle} className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-5 h-5 rounded-full bg-card shadow-sm absolute top-0.5 transition-all ${isDark ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl card-3d hover-3d">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{t('settings.profile')}</h3>
              {user && <p className="text-sm text-muted-foreground">{user.name} • {user.email}</p>}
            </div>
          </div>
        </motion.div>

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={() => { logout(); navigate('/'); }}
          className="w-full p-5 rounded-2xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-all flex items-center gap-3 button-3d">
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="font-semibold text-destructive">{t('settings.logout')}</span>
        </motion.button>
      </div>
    </DashboardLayout>
  );
}
