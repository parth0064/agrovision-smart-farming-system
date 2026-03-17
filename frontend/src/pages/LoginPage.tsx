import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Sprout, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import loginHero from '@/assets/farming-people.jpg';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { googleLogin, emailLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for the Google script to load if it hasn't
    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: "311302625838-2oqtkdsfptg3ljg943rqeaj5hgmcf7hr.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: "outline", size: "large", width: "100%" }
        );
      } else {
        setTimeout(initGoogleSignIn, 100);
      }
    };

    initGoogleSignIn();
  }, [googleButtonRef]);

  const handleCredentialResponse = async (response: any) => {
    try {
      setError('');
      const isNewUser = await googleLogin(response.credential);
      if (isNewUser) {
        navigate('/role-selection');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed. Please try again.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const isNewUser = await emailLogin(email, password);

      // If the user's language is stored in localStorage after emailLogin sets context, apply it
      // useAuth automatically sets the user token block in localStorage, but let's grab it cleanly:
      const stored = localStorage.getItem('agrovision_user');
      if (stored) {
        const userObj = JSON.parse(stored);
        if (userObj.language) {
          i18n.changeLanguage(userObj.language);
        }
      }

      if (isNewUser) {
        navigate('/role-selection');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-accent overflow-hidden">
        <img src={loginHero} alt="Premium Sustainable Farming" className="w-full h-full object-cover object-left transition-transform duration-700 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl font-display font-bold text-white mb-3 tracking-tight">Empowering Farmers</h2>
            <p className="text-white/80 text-lg font-medium">Smart decisions for a sustainable future and better harvest.</p>
          </motion.div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 rounded-2xl bg-card shadow-elevated border border-border flex flex-col items-center">

          {/* Mobile illustration */}
          <div className="lg:hidden w-full mb-6 rounded-xl overflow-hidden shadow-lg border border-border">
            <img src={loginHero} alt="Premium Sustainable Farming" className="w-full h-48 object-cover" />
          </div>

          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <img src="/logo.png" alt="AgroVision Logo" className="w-12 h-12 rounded-xl object-contain shadow-sm bg-white" />
            <span className="font-display font-bold text-2xl text-foreground tracking-tight">AgroVision</span>
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-6">Welcome Back</h2>
          <p className="text-muted-foreground text-center mb-8">Sign in or create an account to access the dashboard.</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="w-full mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="w-full space-y-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="w-full flex items-center gap-4 mb-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Or continue with</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="w-full max-w-[280px]">
            <div ref={googleButtonRef} className="w-full flex justify-center min-h-[40px]"></div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            By continuing, you agree to AgroVision's Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
