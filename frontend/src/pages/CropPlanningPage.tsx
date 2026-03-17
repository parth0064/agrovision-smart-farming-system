import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sprout, TrendingUp, AlertTriangle, Plus, Tag, Trash2, IndianRupee, MapPin, Calendar, CloudRain, Thermometer, Droplets, Wind, LocateFixed, Loader2, ShoppingBag, Clock, X, Camera } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function CropPlanningPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'my-crops' | 'prediction'>('my-crops');
  const [predicting, setPredicting] = useState(false);
  const [adding, setAdding] = useState(false);

  // Prediction State
  const [predForm, setPredForm] = useState({ land_area: '', budget: '', location: '', season: 'Kharif', previous_crop: '', latitude: '', longitude: '' });
  const [predResult, setPredResult] = useState<any>(null);

  // Geolocation State
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);

  // Active Crops State
  const [crops, setCrops] = useState<any[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({ expense_type: 'Seeds', amount: '', notes: '', date: '' });
  const [addingExpense, setAddingExpense] = useState(false);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferCrop, setTransferCrop] = useState<any>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState({ quantity: '', unit: 'kg', pricePerKg: '', pricePerQuintal: '', images: [] as string[] });

  const getToken = () => {
    const str = localStorage.getItem('agrovision_user');
    if (!str) return null;
    return JSON.parse(str)?.token;
  };

  const fetchCrops = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lifecycle/active`, {
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

  useEffect(() => {
    fetchCrops();
  }, []);

  // --- Geolocation Handler ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setFetchingLocation(true);
    setLocationError('');
    setWeatherData(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setPredForm(prev => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng)
        }));

        // Fetch weather data from our backend
        try {
          const token = getToken();
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crop/weather?lat=${lat}&lng=${lng}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setWeatherData(data);
            // Auto-fill location name from weather response
            if (data.city) {
              setPredForm(prev => ({ ...prev, location: data.city }));
            }
          } else {
            setLocationError('Could not fetch weather data. Check your API key.');
          }
        } catch (err) {
          console.error('Weather fetch failed', err);
          setLocationError('Weather service unavailable.');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        setFetchingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please type your location manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crop/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(predForm)
      });
      if (res.ok) {
        const data = await res.json();
        setPredResult(data);
        // Update weather data from prediction response if available
        if (data.weatherData) {
          setWeatherData(data.weatherData);
        }
      }
    } catch (error) {
      console.error('Failed to predict', error);
    } finally {
      setPredicting(false);
    }
  };

  const handleSelectCrop = async (cropData: any, isLowRisk: boolean) => {
    setAdding(true);
    try {
      const token = getToken();
      const payload = {
        cropName: cropData.crop,
        location: predForm.location || 'Unknown',
        landSize: Number(predForm.land_area) || 1,
        plantDate: new Date().toISOString()
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lifecycle/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchCrops();
        setActiveTab('my-crops');
        setPredResult(null);
      }
    } catch (error) {
      console.error('Failed to save crop', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCrop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crop and all its expenses?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lifecycle/active/${id}`, {
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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;
    setAddingExpense(true);
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lifecycle/active/${selectedCrop._id}/expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        await fetchCrops();
        setShowExpenseModal(false);
        setExpenseForm({ expense_type: 'Seeds', amount: '', notes: '', date: '' });
        setSelectedCrop(null);
      }
    } catch (error) {
      console.error('Failed to add expense', error);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleTransferToShelf = (crop: any) => {
    setTransferCrop(crop);
    setTransferForm({ quantity: '', unit: 'kg', pricePerKg: '', pricePerQuintal: '', images: [] });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferCrop) return;
    setTransferring(true);
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lifecycle/active/${transferCrop._id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          quantity: Number(transferForm.quantity),
          unit: transferForm.unit,
          pricePerKg: Number(transferForm.pricePerKg) || 0,
          pricePerQuintal: Number(transferForm.pricePerQuintal) || 0,
          images: transferForm.images
        })
      });
      if (res.ok) {
        setShowTransferModal(false);
        setTransferCrop(null);
        alert('✅ Crop transferred to Shelf Monitoring!');
        fetchCrops();
      } else {
        alert('❌ Transfer failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to transfer crop', error);
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferForm(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const getWeatherIcon = (icon: string) => icon.startsWith('http') ? icon : `https:${icon}`;

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 relative">

        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{t('cropPage.title')}</h1>
            <p className="text-muted-foreground">{t('cropPage.subtitle')}</p>
          </div>
          <div className="flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('my-crops')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'my-crops' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('cropPage.tabMyCrops')}
            </button>
            <button
              onClick={() => setActiveTab('prediction')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'prediction' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('cropPage.tabAI')}
            </button>
          </div>
        </div>

        {/* MY CROPS TAB */}
        {activeTab === 'my-crops' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {loadingCrops ? (
              <p className="text-center text-muted-foreground py-10">{t('cropPage.loading')}</p>
            ) : crops.length === 0 ? (
              <div className="text-center py-16 card-3d rounded-2xl border border-border">
                <Sprout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">{t('cropPage.noCrops')}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">{t('cropPage.noCropsDesc')}</p>
                <button onClick={() => setActiveTab('prediction')} className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d">
                  {t('cropPage.goPredict')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crops.map(crop => {
                  const cropName = crop.cropName || crop.crop_name;
                  const plantDate = crop.plantDate || crop.planting_date;
                  const expense = crop.totalExpense || crop.totalExpenses || 0;
                  const location = crop.location || 'Field';
                  const landSize = crop.landSize || crop.land_area || 0;
                  return (
                  <div key={crop._id} className="relative card-3d hover-3d rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sprout className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{cropName}</h3>
                          <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <MapPin className="w-3 h-3" /> {location} ({landSize} acres)
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteCrop(crop._id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Planted</span>
                        <span className="text-sm font-medium text-foreground">{new Date(plantDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-warning" /> Total Expense</span>
                        <span className="text-sm font-medium text-warning">₹{expense.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-success/5">
                        <span className="text-sm text-success flex items-center gap-2"><Sprout className="w-4 h-4" /> Stage</span>
                        <span className="text-sm font-bold text-success uppercase">{crop.stage || 'Growing'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => { setSelectedCrop(crop); setShowExpenseModal(true); }}
                        className="w-full py-2.5 rounded-xl border border-primary/20 text-primary hover:bg-primary/5 font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Expense
                      </button>
                      <button
                        onClick={() => handleTransferToShelf(crop)}
                        className="w-full py-2.5 rounded-xl bg-success text-white font-bold flex items-center justify-center gap-2 hover:bg-success/90 shadow-md transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" /> Transfer to Shelf Monitoring
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* AI PREDICTION TAB */}
        {activeTab === 'prediction' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-6">

            {/* Form */}
            <div className="w-full lg:w-1/3">
              <form onSubmit={handlePredict} className="space-y-4 p-6 rounded-2xl card-3d sticky top-24">
                <h3 className="text-lg font-semibold text-foreground mb-4">Farm Details</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Land Area (Acres)</label>
                    <input type="number" required value={predForm.land_area} onChange={e => setPredForm({ ...predForm, land_area: e.target.value })} className={inputClass} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Total Budget (₹)</label>
                    <input type="number" required value={predForm.budget} onChange={e => setPredForm({ ...predForm, budget: e.target.value })} className={inputClass} placeholder="e.g. 150000" />
                  </div>

                  {/* Location with Geolocation */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Location</label>
                    <div className="flex gap-2">
                      <input type="text" required value={predForm.location} onChange={e => setPredForm({ ...predForm, location: e.target.value })} className={`${inputClass} flex-1`} placeholder="e.g. Maharashtra" />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={fetchingLocation}
                        className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap disabled:opacity-50"
                        title="Detect my location"
                      >
                        {fetchingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LocateFixed className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{fetchingLocation ? 'Detecting...' : 'Detect'}</span>
                      </button>
                    </div>
                    {locationError && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {locationError}
                      </p>
                    )}
                    {predForm.latitude && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {Number(predForm.latitude).toFixed(4)}, {Number(predForm.longitude).toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* Weather Card (inline in form) */}
                  {weatherData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-xl overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <img src={getWeatherIcon(weatherData.icon)} alt="weather" className="w-12 h-12 -ml-1" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{weatherData.city}</p>
                            <p className="text-xs text-muted-foreground capitalize">{weatherData.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Temp</p>
                              <p className="text-sm font-bold text-foreground">{weatherData.temperature}°C</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Humidity</p>
                              <p className="text-sm font-bold text-foreground">{weatherData.humidity}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Wind className="w-4 h-4 text-teal-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Wind</p>
                              <p className="text-sm font-bold text-foreground">{weatherData.wind_speed} m/s</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <CloudRain className="w-4 h-4 text-indigo-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Rain</p>
                              <p className="text-sm font-bold text-foreground">{weatherData.rainfall} mm</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Season</label>
                    <select value={predForm.season} onChange={e => setPredForm({ ...predForm, season: e.target.value })} className={inputClass}>
                      <option value="Kharif">Kharif (Monsoon)</option>
                      <option value="Rabi">Rabi (Winter)</option>
                      <option value="Zaid">Zaid (Summer)</option>
                      <option value="Annual">Annual/Perennial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Previous Crop (Optional)</label>
                    <input type="text" value={predForm.previous_crop} onChange={e => setPredForm({ ...predForm, previous_crop: e.target.value })} className={inputClass} placeholder="e.g. Wheat" />
                  </div>
                </div>

                <button type="submit" disabled={predicting} className="w-full mt-2 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d disabled:opacity-50">
                  {predicting ? 'Analyzing...' : 'Generate Prediction'}
                </button>
              </form>
            </div>

            {/* Results */}
            <div className="w-full lg:w-2/3">
              {!predResult ? (
                <div className="h-full min-h-[400px] card-3d border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                  <BotIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">AI Awaiting Input</h3>
                  <p className="text-muted-foreground max-w-md">Our algorithm analyzes your land area, budget, seasonal conditions, and <span className="text-primary font-medium">real-time weather data</span> to find the perfect crop matches.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                  {/* Weather Summary Banner */}
                  {weatherData && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/15"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <CloudRain className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Weather-Aware Prediction</p>
                          <p className="text-xs text-muted-foreground">
                            {weatherData.city} — {weatherData.temperature}°C, {weatherData.humidity}% humidity
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold">Climate Used ✓</span>
                    </motion.div>
                  )}

                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Prediction Results
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Low Risk */}
                    <div className="card-3d hover-3d rounded-2xl border-2 border-primary/40 p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold uppercase tracking-wider rounded-full">Safest Bet (Low Risk)</span>
                      </div>
                      <h3 className="text-3xl font-display font-bold text-foreground mb-1">{predResult.lowRiskCrop}</h3>
                      <p className="text-muted-foreground text-sm mb-2">High probability of success based on budget and climate.</p>
                      {predResult.bestLowRiskData?.score !== undefined && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${predResult.bestLowRiskData.score}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-success">{predResult.bestLowRiskData.score}%</span>
                        </div>
                      )}

                      <div className="bg-muted rounded-xl p-4 mb-6">
                        <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Est. Profit</div>
                        <div className="text-2xl font-bold text-success">₹{predResult.estimatedProfitLow.toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => handleSelectCrop(predResult.bestLowRiskData, true)}
                        disabled={adding}
                        className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold button-3d mt-auto"
                      >
                        Select & Add to Dashboard
                      </button>
                    </div>

                    {/* High Profit */}
                    <div className="card-3d hover-3d rounded-2xl p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-warning/10 text-warning text-xs font-bold uppercase tracking-wider rounded-full">High Reward (Wildcard)</span>
                      </div>
                      <h3 className="text-3xl font-display font-bold text-foreground mb-1">{predResult.highProfitCrop}</h3>
                      <p className="text-muted-foreground text-sm mb-2">Maximizes returns but may require more care or perfect weather.</p>
                      {predResult.bestHighProfitData?.score !== undefined && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${predResult.bestHighProfitData.score}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-warning">{predResult.bestHighProfitData.score}%</span>
                        </div>
                      )}

                      <div className="bg-muted rounded-xl p-4 mb-6">
                        <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Est. Profit</div>
                        <div className="text-2xl font-bold text-warning">₹{predResult.estimatedProfitHigh.toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => handleSelectCrop(predResult.bestHighProfitData, false)}
                        disabled={adding}
                        className="w-full py-3 rounded-xl border-2 border-primary/50 text-primary font-semibold hover:bg-primary/10 mt-auto transition-all hover:-translate-y-0.5"
                      >
                        Take Risk & Select
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

        {/* EXPENSE MODAL */}
        {showExpenseModal && selectedCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md rounded-2xl shadow-elevated border border-border p-6 relative">
              <button onClick={() => setShowExpenseModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>

              <h2 className="text-xl font-bold text-foreground mb-1">Add Expense</h2>
              <p className="text-muted-foreground text-sm mb-6">Recording cost for {selectedCrop.cropName || selectedCrop.crop_name}</p>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Expense Type</label>
                  <select value={expenseForm.expense_type} onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })} className={inputClass}>
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizer">Fertilizer & Chemicals</option>
                    <option value="Labor">Labor & Wages</option>
                    <option value="Equipment">Equipment & Machinery</option>
                    <option value="Transport">Transport & Logistics</option>
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
                  <label className="block text-sm font-medium text-foreground mb-1">Date (Optional)</label>
                  <input type="datetime-local" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className={inputClass} />
                  <p className="text-xs text-muted-foreground mt-1">Leaves blank to use current date & time.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes (Optional)</label>
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

        {/* TRANSFER TO SHELF MODAL */}
        {showTransferModal && transferCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md rounded-2xl shadow-elevated border border-border p-6 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowTransferModal(false)} 
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-muted p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 pr-8">
                <h2 className="text-2xl font-display font-bold text-foreground">Prepare for Shelf</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Transferring <strong>{transferCrop.cropName || transferCrop.crop_name}</strong> to the marketplace & shelf tracking.
                </p>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning font-semibold uppercase tracking-wider mb-1">Total Investment to Recover</p>
                <p className="text-2xl font-bold text-warning">₹{(transferCrop.totalExpense || transferCrop.totalExpenses || 0).toLocaleString()}</p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-foreground mb-1.5 flex justify-between items-center pr-2">
                      <span>Harvested Qty</span>
                      <select 
                        value={transferForm.unit} 
                        onChange={(e) => setTransferForm({ ...transferForm, unit: e.target.value })}
                        className="text-xs bg-muted/50 border border-border rounded px-1.5 py-0.5 font-bold text-primary focus:ring-0 cursor-pointer"
                      >
                        <option value="kg">kg</option>
                        <option value="Quintal">Quintal</option>
                      </select>
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={transferForm.quantity} 
                      onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} 
                      className={inputClass} 
                      placeholder="e.g. 500" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-foreground mb-1.5 mt-[3px]">Price/kg (₹)</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={transferForm.pricePerKg} 
                      onChange={(e) => setTransferForm({ ...transferForm, pricePerKg: e.target.value })} 
                      className={inputClass} 
                      placeholder="e.g. 45" 
                    />
                  </div>
                </div>

                {transferForm.unit === 'Quintal' && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Target Price/Quintal (₹)</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={transferForm.pricePerQuintal} 
                      onChange={(e) => setTransferForm({ ...transferForm, pricePerQuintal: e.target.value })} 
                      className={inputClass} 
                      placeholder="e.g. 4500" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Crop Images (Optional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Click to upload photos</p>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleTransferImageUpload} />
                  </label>
                  
                  {transferForm.images.length > 0 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {transferForm.images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-border group">
                          <img src={img} alt="crop" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setTransferForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={transferring || !transferForm.quantity || !transferForm.pricePerKg} 
                    className="w-full py-4 rounded-xl bg-success text-white font-bold hover:bg-success/90 shadow-lg shadow-success/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {transferring ? 'Processing...' : 'Transfer to Shelf Monitoring'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

// Quick inline icon since Bot isn't imported
function BotIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
}
