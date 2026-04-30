import React, { useState, useEffect, useRef } from 'react';
import { Scale, RefreshCw, ChevronRight, MessageSquare, Compass, Activity, BookOpen, LogOut } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AuthModal from './AuthModal';

// You can use this component in any React project with Tailwind CSS configured.
// Run: npm install lucide-react

export default function StoicAdvisorDashboard() {
  const [user, loadingAuth] = useAuthState(auth);
  const [mode, setMode] = useState<'market' | 'wisdom'>('market');
  
  // Calculator state
  const [expenses, setExpenses] = useState(3000);
  const [passiveIncome, setPassiveIncome] = useState(500);
  const [savings, setSavings] = useState(1200);
  const [returnRate, setReturnRate] = useState(7);
  const [savingsBuffer, setSavingsBuffer] = useState(18000);

  // Firestore sync
  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.expenses) setExpenses(data.expenses);
          if (data.passiveIncome) setPassiveIncome(data.passiveIncome);
          if (data.savings) setSavings(data.savings);
          if (data.returnRate) setReturnRate(data.returnRate);
          if (data.savingsBuffer) setSavingsBuffer(data.savingsBuffer);
        }
      };
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        setDoc(doc(db, 'users', user.uid), {
          expenses, passiveIncome, savings, returnRate, savingsBuffer
        }, { merge: true });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, expenses, passiveIncome, savings, returnRate, savingsBuffer]);

  // Derived metrics
  const freedomThreshold = (expenses * 12) / (returnRate / 100);
  const bufferCoverage = expenses > 0 ? (savingsBuffer / expenses) : 0;
  
  // Projection calculation
  let current = savingsBuffer;
  let months = 0;
  const monthlyRate = returnRate / 100 / 12;
  const chartData = [];
  const currentYear = new Date().getFullYear();
  
  chartData.push({ year: currentYear, amount: current });
  
  while (current < freedomThreshold && months < 1200) {
    current = current * (1 + monthlyRate) + savings;
    months++;
    if (months % 12 === 0) {
      chartData.push({ year: currentYear + (months / 12), amount: current });
    }
  }
  
  if (months % 12 !== 0) {
    chartData.push({ year: currentYear + Math.ceil(months / 12), amount: current });
  }

  const yearsToAutonomy = months / 12;
  const estFreedomDate = currentYear + Math.ceil(yearsToAutonomy);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'advisor', text: "Welcome. Before we discuss any investment, tell me: what does financial freedom mean to you — more things, or more time?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');
    
    setTimeout(() => {
      const stoicResponses = [
        "Does this purchase buy you more things, or more time?",
        "Remember: wealth is what you don't see. The money not spent is what buys your autonomy.",
        "The market's mood today has nothing to do with your goals for 2040.",
        "Are you moving the goalposts? 'Enough' is a powerful metric.",
        "Control what you can: your savings rate, your asset allocation, and your reaction to noise."
      ];
      const reply = stoicResponses[Math.floor(Math.random() * stoicResponses.length)];
      setChatMessages(prev => [...prev, { role: 'advisor', text: reply }]);
    }, 800);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const newsFeed = [
    { category: 'MACRO', time: '22m ago', title: 'Consumer confidence rises for third consecutive month', sentiment: 68, stoic: 'Reacting to this is optional. Patience is always mandatory.' },
    { category: 'RATES', time: '2m ago', title: 'Fed holds rates steady as inflation data surprises', sentiment: 55, stoic: 'Markets fluctuate. Principles don\'t. Stay the course.' },
    { category: 'CRYPTO', time: '14m ago', title: 'Bitcoin consolidates after weekend volatility spike', sentiment: 38, stoic: 'The market is always having an opinion. Yours doesn\'t need to change.' },
    { category: 'STOCKS', time: '41m ago', title: 'Nasdaq extends gains; growth stocks lead rally', sentiment: 77, stoic: 'Volatility is the admission price for long-term returns.' },
  ];

  const wisdomPrinciples = [
    { title: 'EMOTIONAL DISCIPLINE', quote: 'Most financial decisions are emotional, not mathematical. Know your triggers.', source: 'Behavioral Finance' },
    { title: 'MAGIC OF COMPOUNDING', quote: 'Compounding rewards patience, not intelligence. It doesn\'t care how smart you are.', source: 'Behavioral Finance Principle' },
    { title: 'TIME > MONEY', quote: 'You can always earn more money. You cannot earn more time.', source: 'Stoic Principle' },
    { title: 'UNCERTAINTY IS NORMAL', quote: 'No one knows what markets will do. The best plan survives not knowing.', source: 'Behavioral Finance' },
    { title: 'AUTONOMY OVER NET WORTH', quote: 'The goal of money is not more money — it is more control over your time.', source: 'Morgan Housel' },
    { title: 'THE WEALTH PARADOX', quote: 'Wealth is what you don\'t see — money unspent, status unflaunted.', source: 'Morgan Housel' },
    { title: 'CONTROL THE GOALPOSTS', quote: 'Enough is understanding when having more would not improve your life.', source: 'Morgan Housel' },
    { title: 'COMPOUNDING LIVES', quote: 'The most powerful force in investing is also the most boring: waiting.', source: 'Stoic Advisor' },
  ];

  if (loadingAuth) {
    return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-emerald-500 animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      {!user && <AuthModal />}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900/30 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Scale size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Stoic Advisor</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-500/70 uppercase mt-1">Behavioral Finance · Long-Term Clarity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {user && (
              <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors">
                <LogOut size={14} /> Sign Out
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50 text-xs font-medium text-slate-400 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              LIVE
            </div>
            <div className="flex bg-slate-800/80 rounded-full p-1 border border-slate-700/50 shadow-inner">
              <button 
                onClick={() => setMode('market')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'market' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
              >
                Market Mode
              </button>
              <button 
                onClick={() => setMode('wisdom')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'wisdom' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
              >
                Wisdom Mode
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {mode === 'market' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            
            {/* Left Column (Calculators) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Autonomy Score */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8"></div>
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-500 uppercase mb-8">
                  <Activity size={14} /> Autonomy Score
                </h2>
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="10" />
                      <circle 
                        cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10" 
                        strokeDasharray="263.89" 
                        strokeDashoffset={263.89 - (263.89 * Math.min(bufferCoverage / 24, 1))} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                      <span className="text-4xl font-bold text-slate-100">{Math.min(Math.round((bufferCoverage/24)*100), 100)}</span>
                      <span className="text-xs text-slate-500 font-medium mt-1">/ 100</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-emerald-400 mb-2">Early Stage</h3>
                  <p className="text-sm text-slate-400 text-center">You can sustain <strong className="text-slate-200">~{Math.round(bufferCoverage)} months</strong> without income</p>
                </div>
              </div>

              {/* Time to Autonomy Calculator */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-500 uppercase mb-6">
                  <Compass size={14} /> Time to Autonomy
                </h2>
                
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-xs text-slate-400 mb-1.5 transition-colors group-focus-within:text-emerald-500">Monthly Expenses ($)</label>
                    <input type="number" value={expenses} onChange={e => setExpenses(Number(e.target.value))} className="w-full bg-[#1a2333] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                  <div className="group">
                    <label className="block text-xs text-slate-400 mb-1.5 transition-colors group-focus-within:text-emerald-500">Monthly Passive Income ($)</label>
                    <input type="number" value={passiveIncome} onChange={e => setPassiveIncome(Number(e.target.value))} className="w-full bg-[#1a2333] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                  <div className="group">
                    <label className="block text-xs text-slate-400 mb-1.5 transition-colors group-focus-within:text-emerald-500">Monthly Savings ($)</label>
                    <input type="number" value={savings} onChange={e => setSavings(Number(e.target.value))} className="w-full bg-[#1a2333] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs text-slate-400">Expected Return Rate</label>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">{returnRate}%</span>
                    </div>
                    <input type="range" min="1" max="15" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full accent-emerald-500" />
                  </div>
                  <div className="group">
                    <label className="block text-xs text-slate-400 mb-1.5 transition-colors group-focus-within:text-emerald-500">Current Savings Buffer ($)</label>
                    <input type="number" value={savingsBuffer} onChange={e => setSavingsBuffer(Number(e.target.value))} className="w-full bg-[#1a2333] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Freedom Threshold</span>
                    <span className="text-sm font-bold text-slate-200 tracking-wide">${Math.round(freedomThreshold).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Years to Autonomy</span>
                    <span className="text-sm font-bold text-slate-200 tracking-wide">~{yearsToAutonomy.toFixed(1)} yrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Est. Freedom Date</span>
                    <span className="text-sm font-bold text-slate-200 tracking-wide">{estFreedomDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Buffer Coverage</span>
                    <span className="text-sm font-bold text-emerald-400 tracking-wide">{bufferCoverage.toFixed(1)} months</span>
                  </div>
                </div>
                
                {/* Embedded SVG Line Chart */}
                <div className="mt-8 h-32 w-full relative">
                  <div className="absolute inset-0 flex flex-col justify-between py-2">
                    <div className="w-full h-px bg-slate-800/50"></div>
                    <div className="w-full h-px bg-slate-800/50"></div>
                    <div className="w-full h-px bg-slate-800/50"></div>
                    <div className="w-full h-px bg-slate-800/50"></div>
                  </div>
                  {chartData.length > 0 && (
                    <svg className="w-full h-full relative z-10" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d={`M 0,100 L ${chartData.map((d, i) => `${(i / (chartData.length - 1 || 1)) * 300},${100 - Math.min((d.amount / freedomThreshold) * 100, 100)}`).join(' L ')} L 300,100 Z`} 
                        fill="url(#fillGrad)" 
                      />
                      <path 
                        d={`M ${chartData.map((d, i) => `${(i / (chartData.length - 1 || 1)) * 300},${100 - Math.min((d.amount / freedomThreshold) * 100, 100)}`).join(' L ')}`} 
                        fill="none" 
                        stroke="url(#lineGrad)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Divider Line */}
            <div className="hidden lg:block lg:col-span-1 relative">
              <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500/30 via-slate-800 to-slate-800/10 rounded-full"></div>
            </div>

            {/* Right Column (News & Chat) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Market Sentiment */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50"></div>
                  <span className="text-3xl font-bold text-emerald-400 mb-1 group-hover:scale-105 transition-transform">63%</span>
                  <span className="text-[10px] tracking-[0.2em] font-medium text-slate-500 uppercase">Bullish</span>
                </div>
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-500/50"></div>
                  <span className="text-3xl font-bold text-slate-400 mb-1 group-hover:scale-105 transition-transform">22%</span>
                  <span className="text-[10px] tracking-[0.2em] font-medium text-slate-500 uppercase">Neutral</span>
                </div>
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
                  <span className="text-3xl font-bold text-red-400 mb-1 group-hover:scale-105 transition-transform">15%</span>
                  <span className="text-[10px] tracking-[0.2em] font-medium text-slate-500 uppercase">Bearish</span>
                </div>
              </div>
              
              {/* Market Wisdom Feed */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-500 uppercase">
                    <Activity size={14} /> Market Wisdom Feed
                  </h2>
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors border border-slate-700 hover:border-emerald-500/50 rounded-lg px-3 py-1.5 shadow-sm">
                    <RefreshCw size={12} className="hover:animate-spin" /> Refresh
                  </button>
                </div>
                
                <div className="space-y-6">
                  {newsFeed.map((item, i) => (
                    <div key={i} className="border-b border-slate-800/60 last:border-0 pb-6 last:pb-0 group">
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider
                          ${item.category === 'MACRO' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
                            item.category === 'CRYPTO' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' : 
                            item.category === 'STOCKS' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 
                            'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                          {item.category}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{item.time}</span>
                      </div>
                      <h3 className="text-[15px] font-medium text-slate-200 mb-3 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[11px] uppercase tracking-wider font-medium text-slate-500 w-16">Sentiment</span>
                        <div className="flex-1 h-1.5 bg-[#1a2333] rounded-full overflow-hidden shadow-inner">
                           <div 
                              className={`h-full rounded-full ${item.sentiment > 60 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : item.sentiment < 40 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-400'}`} 
                              style={{ width: `${item.sentiment}%` }}
                           ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-8 text-right">{item.sentiment}%</span>
                      </div>
                      <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-3">
                        <p className="text-sm text-emerald-400/90 italic flex gap-2 items-start">
                          <span className="font-serif font-bold text-emerald-500 opacity-50 mt-1">"</span>
                          <span><strong className="font-semibold not-italic text-emerald-500/70 text-xs uppercase tracking-wider mr-2">Stoic Filter:</strong>{item.stoic}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stoic Advisor Chat */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[380px]">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-500 uppercase mb-6 shrink-0">
                  <MessageSquare size={14} /> Stoic Advisor Chat
                </h2>
                
                <div className="flex-1 overflow-y-auto pr-3 space-y-5 mb-5 custom-scrollbar">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      {msg.role === 'advisor' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-900/40 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                          <Scale size={14} />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm
                        ${msg.role === 'user' 
                          ? 'bg-slate-800 text-slate-200 rounded-tr-sm border border-slate-700' 
                          : 'bg-[#1a2333] text-slate-300 rounded-tl-sm border border-slate-700/50'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleChat} className="flex gap-3 mt-auto shrink-0 relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask: Should I buy this? Is now a good time..." 
                    className="flex-1 bg-[#1a2333] border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 shadow-inner transition-all" 
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-4 flex items-center gap-2 transition-all font-medium text-sm"
                  >
                    Ask <ChevronRight size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Wisdom Mode Content */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900 opacity-80"></div>
              <div className="absolute -top-10 -right-10 text-emerald-500/5 rotate-12">
                <BookOpen size={200} />
              </div>
              <p className="text-2xl md:text-4xl font-serif text-slate-200 italic leading-relaxed mb-8 relative z-10">
                "The goal of money is not more money — it is more control over your time."
              </p>
              <p className="text-emerald-500/80 tracking-[0.2em] font-bold text-xs uppercase relative z-10">
                — Morgan Housel · Psychology of Money
              </p>
            </div>
            
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl relative z-10">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase mb-8">
                <BookOpen size={16} /> Deep Wisdom Principles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {wisdomPrinciples.map((item, i) => (
                  <div key={i} className="bg-[#1a2333] border border-slate-700/50 hover:border-emerald-500/40 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] group">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-emerald-500/80 uppercase mb-4 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                    <p className="text-[17px] font-serif text-slate-200 mb-6 leading-relaxed group-hover:text-white transition-colors">
                      <span className="text-emerald-500/40 text-xl font-serif mr-1">"</span>
                      {item.quote}
                      <span className="text-emerald-500/40 text-xl font-serif ml-1">"</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-px bg-slate-700 group-hover:bg-emerald-500/50 transition-colors"></div>
                      <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500">{item.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 20px; }
      `}} />
    </div>
  );
}
