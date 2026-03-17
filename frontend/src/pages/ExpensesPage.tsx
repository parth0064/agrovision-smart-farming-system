import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Sprout, Clock, ArrowUpRight, ArrowDownRight, Droplets, HardHat, TrendingUp, FileText, Download } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from 'react-i18next';

export default function ExpensesPage() {
    const { t } = useTranslation();
    const [crops, setCrops] = useState<any[]>([]);
    const [selectedCropId, setSelectedCropId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Forms
    const [expenseForm, setExpenseForm] = useState({ expense_type: 'Labor', amount: '', notes: '' });
    const [incomeForm, setIncomeForm] = useState({ amount: '', source: 'Market', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    // History
    const [logs, setLogs] = useState<any[]>([]); // Combined expenses and income

    const getToken = () => {
        const str = localStorage.getItem('agrovision_user');
        if (!str) return null;
        return JSON.parse(str)?.token;
    };

    const fetchCrops = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crop`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCrops(data);
                if (data.length > 0 && !selectedCropId) {
                    setSelectedCropId(data[0]._id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch crops', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!selectedCropId) return;
        try {
            const token = getToken();

            // Fetch Expenses
            const expRes = await fetch(`${import.meta.env.VITE_API_URL}/api/crop/${selectedCropId}/expense`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const expenses = expRes.ok ? await expRes.json() : [];

            // Fetch Income
            const incRes = await fetch(`${import.meta.env.VITE_API_URL}/api/crop/${selectedCropId}/income`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const income = incRes.ok ? await incRes.json() : [];

            // Tag and merge
            const taggedExpenses = expenses.map(e => ({ ...e, type: 'expense' }));
            const taggedIncome = income.map(i => ({ ...i, type: 'income' }));

            const allLogs = [...taggedExpenses, ...taggedIncome].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setLogs(allLogs);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        }
    };

    useEffect(() => {
        fetchCrops();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedCropId]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCropId) return;
        setSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crop/${selectedCropId}/expense`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...expenseForm, date: new Date().toISOString() }) // Enforces real-time today
            });
            if (res.ok) {
                setExpenseForm({ expense_type: 'Labor', amount: '', notes: '' });
                fetchLogs();
                fetchCrops(); // Update total invested
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddIncome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCropId) return;
        setSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crop/${selectedCropId}/income`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...incomeForm, date: new Date().toISOString() })
            });
            if (res.ok) {
                setIncomeForm({ amount: '', source: 'Market', notes: '' });
                fetchLogs();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCropData = crops.find(c => c._id === selectedCropId);
    const totalIncome = logs.filter(l => l.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = selectedCropData?.totalExpenses || 0;
    const netProfit = totalIncome - totalExpense;

    const inputClass = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

    const exportToCSV = () => {
        if (!logs.length || !selectedCropData) return;

        const headers = ["Date", "Time", "Type", "Category/Source", "Amount (INR)", "Notes"];
        const rows = logs.map(log => {
            const d = new Date(log.createdAt);
            const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const type = log.type === 'income' ? 'Income' : 'Expense';
            const category = log.type === 'income' ? log.source : log.expense_type;
            const amount = log.amount;
            const notes = log.notes || "";
            return [date, time, type, category, amount, `"${notes.replace(/"/g, '""')}"`];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const fileName = `${selectedCropData.crop_name}_Ledger_${new Date().toISOString().split('T')[0]}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            {/* Dynamic 3D Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
              <div className="bg-orb-1 opacity-30"></div>
              <div className="bg-orb-2 opacity-30"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-6 relative z-0">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">{t('expensesPage.title')}</h1>
                        <p className="text-muted-foreground pt-1">{t('expensesPage.subtitle')}</p>
                    </div>

                    <div className="min-w-[250px]">
                        <select
                            value={selectedCropId}
                            onChange={(e) => setSelectedCropId(e.target.value)}
                            className={`${inputClass} font-semibold`}
                            disabled={loading || crops.length === 0}
                        >
                            {crops.length === 0 ? (
                                <option value="">{t('expensesPage.noActiveCrops')}</option>
                            ) : (
                                crops.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.crop_name} - {c.location} ({c.land_area} {c.isStorage || c.isSelling ? (c.unit || 'units') : 'Ac'})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {crops.length === 0 && !loading ? (
                    <div className="text-center py-16 bg-card rounded-3xl border border-border shadow-sm">
                        <Sprout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground">{t('expensesPage.noCropsTitle')}</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">{t('expensesPage.noCropsDesc')}</p>
                    </div>
                ) : (
                    <>
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-3d rounded-3xl p-6 hover-3d flex flex-col justify-center">
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ArrowDownRight className="w-4 h-4 text-destructive" /> {t('expensesPage.totalInvested')}
                                </p>
                                <p className="text-3xl font-display font-bold text-destructive">₹{totalExpense.toLocaleString()}</p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-3d rounded-3xl p-6 hover-3d flex flex-col justify-center">
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4 text-success" /> {t('expensesPage.totalRecovered')}
                                </p>
                                <p className="text-3xl font-display font-bold text-success">₹{totalIncome.toLocaleString()}</p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`card-3d hover-3d rounded-3xl p-6 flex flex-col justify-center ${netProfit >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                <p className={`text-sm font-semibold uppercase tracking-widest mb-2 flex items-center gap-2 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    <TrendingUp className="w-4 h-4" /> {netProfit >= 0 ? t('expensesPage.netProfit') : t('expensesPage.netDeficit')}
                                </p>
                                <p className={`text-4xl font-display font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {netProfit < 0 ? '-' : '+'}₹{Math.abs(netProfit).toLocaleString()}
                                </p>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Left Column: Input Forms */}
                            <div className="lg:col-span-5 space-y-6">

                                {/* Add Expense Form */}
                                <div className="card-3d rounded-3xl p-6">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4 relative z-10">
                                        <HardHat className="w-5 h-5 text-destructive" /> Spend Money
                                    </h3>
                                    <form onSubmit={handleAddExpense} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Type</label>
                                                <select value={expenseForm.expense_type} onChange={e => setExpenseForm({ ...expenseForm, expense_type: e.target.value })} className={inputClass}>
                                                    <option value="Labor">Worker / Labor</option>
                                                    <option value="Fertilizer">Fertilizer</option>
                                                    <option value="Seeds">Seeds</option>
                                                    <option value="Transport">Transport</option>
                                                    <option value="Equipment">Equipment</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount (₹)</label>
                                                <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputClass} placeholder="0" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Note</label>
                                            <input type="text" value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} className={inputClass} placeholder="e.g. 5 workers weeding" />
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50 button-3d">
                                            Record Expense
                                        </button>
                                    </form>
                                </div>

                                {/* Add Profit Form */}
                                <div className="card-3d rounded-3xl p-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-bl-[100px] pointer-events-none" />
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4 relative z-10">
                                        <IndianRupee className="w-5 h-5 text-success" /> Add Today's Profit
                                    </h3>
                                    <form onSubmit={handleAddIncome} className="space-y-4 relative z-10">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Source</label>
                                                <select value={incomeForm.source} onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })} className={inputClass}>
                                                    <option value="Market">Local Market</option>
                                                    <option value="Mandi">Mandi</option>
                                                    <option value="Direct">Direct Buyer</option>
                                                    <option value="Processor">Factory/Processor</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount (₹)</label>
                                                <input type="number" required value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} className={inputClass} placeholder="0" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                                            <input type="text" value={incomeForm.notes} onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })} className={inputClass} placeholder="e.g. Sold 5 quintals of wheat" />
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors disabled:opacity-50 button-3d">
                                            Record Income
                                        </button>
                                    </form>
                                </div>

                            </div>

                            {/* Right Column: History Log */}
                            <div className="lg:col-span-7 card-3d rounded-3xl p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" /> Daily Ledger
                                        </h3>
                                        <span className="text-sm font-semibold text-muted-foreground px-3 py-1 rounded-full bg-muted">
                                            {logs.length} Entries
                                        </span>
                                    </div>
                                    <button
                                        onClick={exportToCSV}
                                        disabled={logs.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-all disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" /> Export
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-3 custom-scrollbar">
                                    {logs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-center h-full opacity-50">
                                            <FileText className="w-12 h-12 mb-3" />
                                            <p>No transactions recorded for this crop yet.</p>
                                        </div>
                                    ) : (
                                        logs.map((log, i) => {
                                            const isIncome = log.type === 'income';
                                            const dateObj = new Date(log.createdAt);

                                            return (
                                                <motion.div
                                                    key={log._id + i}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border ${isIncome ? 'bg-success/5 border-success/10' : 'bg-destructive/5 border-destructive/10'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                                                            {isIncome ? <TrendingUp className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{isIncome ? log.source : log.expense_type}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                <span>{dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                •
                                                                <span>{dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                            </div>
                                                            {log.notes && <p className="text-xs text-muted-foreground/80 mt-1 truncate max-w-[200px] md:max-w-[300px]">{log.notes}</p>}
                                                        </div>
                                                    </div>

                                                    <div className={`text-right font-display font-bold text-lg ${isIncome ? 'text-success' : 'text-foreground'}`}>
                                                        {isIncome ? '+' : '-'}₹{log.amount.toLocaleString()}
                                                    </div>
                                                </motion.div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
