import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Store, Globe, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function RoleSelectionPage() {
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedState, setSelectedState] = useState('');
    const [city, setCity] = useState('');
    const [language, setLanguage] = useState('en');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth(); // We'll hijack login to update the user with the new token
    const { i18n } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role || !selectedState || !city) {
            setError('Please complete all required fields to continue.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const storedUserStr = localStorage.getItem('agrovision_user');
            const tempUser = storedUserStr ? JSON.parse(storedUserStr) : null;

            if (!tempUser || !tempUser.token) {
                throw new Error('No authentication token found. Please sign in again.');
            }

            const location = `${city}, ${selectedState}`;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempUser.token}`
                },
                body: JSON.stringify({ role, password, language, location })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update user profile');
            }

            localStorage.setItem('agrovision_user', JSON.stringify(data));

            // Apply language immediately
            if (language) {
                i18n.changeLanguage(language);
                localStorage.setItem('language', language);
            }

            window.location.href = '/dashboard';

        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = [
        { id: 'farmer', title: 'Farmer', description: 'Access smart crop planning and pricing intelligence', icon: User },
        { id: 'buyer', title: 'Buyer', description: 'Connect with farmers and track market prices', icon: Store },
    ];

    const indianStates = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
        "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
        "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ];

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dynamic 3D Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="bg-orb-1 opacity-20"></div>
                <div className="bg-orb-2 opacity-20"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full card-3d rounded-3xl shadow-elevated p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-foreground">Complete Your Profile</h2>
                    <p className="text-muted-foreground mt-2">Set up your account preferences.</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-foreground">1. Select your Role</h3>
                        <div className="space-y-3">
                            {roleOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setRole(option.id)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${role === option.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/30 hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${role === option.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            <option.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${role === option.id ? 'text-primary' : 'text-foreground'}`}>
                                                {option.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                Preferred Language
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full mt-1 p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground appearance-none"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="mr">मराठी (Marathi)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                Your Location
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">
                                Select your state and enter your city/district to connect with local buyers or farmers.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                    className="w-full sm:w-1/2 p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select State / UT</option>
                                    {indianStates.map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="City, District, or Town"
                                    className="w-full sm:w-1/2 p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                Set a Password
                            </label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Please set a password so you can log in with your email next time.
                            </p>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a secure password"
                                    className="w-full p-3 pr-10 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground"
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
                    </div>

                    <button
                        type="submit"
                        disabled={!role || !password || isSubmitting}
                        className="w-full mt-8 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving Profile...' : 'Complete Setup & Enter Dashboard'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
