import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Shield, Search, Clock, ChevronRight, Activity, Brain, CheckCircle, AlertCircle, Maximize2, List, Info, Database, Layers } from 'lucide-react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

const API_BASE = 'http://localhost:8000';

function App() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const generateFlow = (log, explanationData) => {
    const summary = explanationData?.summary || "Analyzing...";
    
    const initialNodes = [
      {
        id: '1',
        data: { label: '🎯 TRIGGER: ' + log.function_name },
        position: { x: 50, y: 50 },
        style: { background: 'rgba(67, 56, 202, 0.2)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '16px', padding: '12px', width: 220, backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: '600' }
      },
      {
        id: '2',
        data: { label: '🧠 LOGIC: ' + summary.substring(0, 40) + '...' },
        position: { x: 50, y: 150 },
        style: { background: 'rgba(126, 34, 206, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '12px', width: 220, backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: '600' }
      },
      {
        id: '3',
        data: { label: '✅ RESULT: ' + log.final_decision },
        position: { x: 50, y: 250 },
        style: { background: 'rgba(5, 150, 105, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '12px', width: 220, backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: '600' }
      }
    ];

    const initialEdges = [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const handleSelectLog = async (log) => {
    setSelectedLog(log);
    setExplanation(null);
    setLoading(true);
    generateFlow(log, null);
    try {
      const res = await axios.get(`${API_BASE}/explain/${log.id}`);
      setExplanation(res.data.explanation);
      generateFlow(log, res.data.explanation);
    } catch (err) {
      console.error("Failed to fetch explanation", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.function_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.final_decision.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050507] text-slate-300 font-sans p-6 selection:bg-indigo-500/30">
      {/* Glow Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between mb-10 max-w-[1600px] mx-auto px-4">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-lg shadow-indigo-500/5">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              AUDIT TRAIL <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">CORE</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em] mt-1">Explainable Governance Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/40 p-2.5 px-5 rounded-2xl border border-slate-800/50 backdrop-blur-xl">
          <div className="relative">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="absolute inset-0 bg-emerald-400/20 animate-ping rounded-full"></div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Node Cluster: Stable</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto px-4">
        {/* Left Column: Log Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-all" />
            <input 
              type="text" 
              placeholder="Filter Decision Logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/30 border border-slate-800/80 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all text-slate-200 placeholder:text-slate-600 backdrop-blur-sm"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
            {filteredLogs.map((log) => (
              <div 
                key={log.id}
                onClick={() => handleSelectLog(log)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  selectedLog?.id === log.id 
                  ? 'bg-indigo-500/10 border-indigo-500/40' 
                  : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                {selectedLog?.id === log.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                  {log.function_name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                   <div className="px-2 py-0.5 bg-slate-800/50 rounded-md text-[9px] font-bold text-slate-400 border border-slate-700/50">ID: {log.agent_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Deep Analysis */}
        <div className="lg:col-span-9 space-y-8">
          {selectedLog ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* Top Summary Card */}
              <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800/50 p-10 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                  <Shield className="w-64 h-64" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/20">Decision Analysis</span>
                       <span className="text-slate-600 font-mono text-[10px]">VER: 1.0.4</span>
                    </div>
                    <h2 className="text-4xl font-black text-white">Path to <span className="text-indigo-400">Verdict</span></h2>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-3xl border border-slate-800/80">
                     <Clock className="w-5 h-5 text-slate-500" />
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Recorded At</p>
                        <p className="text-sm font-mono text-white">{selectedLog.timestamp}</p>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Decision Flow Graph */}
                  <div className="h-[400px] bg-slate-950/50 rounded-[2rem] border border-slate-800/80 relative group overflow-hidden shadow-inner">
                    <div className="absolute bottom-4 right-6 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 px-4 rounded-xl border border-white/5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Inference Graph</span>
                    </div>
                    <ReactFlow 
                      nodes={nodes} 
                      edges={edges} 
                      fitView
                      zoomOnScroll={false}
                      zoomOnPinch={false}
                      panOnDrag={true}
                      nodesDraggable={true}
                    >
                      <Background color="#1e293b" gap={20} size={1} />
                    </ReactFlow>
                  </div>

                  {/* Quick Metadata Info */}
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3 mb-4 text-slate-400">
                        <Search className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Trigger Context</span>
                      </div>
                      <pre className="text-[11px] leading-relaxed text-indigo-300 font-mono bg-black/20 p-4 rounded-xl border border-white/5 overflow-x-auto">
                        {JSON.stringify(JSON.parse(selectedLog.trigger_event), null, 2)}
                      </pre>
                    </div>
                    <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      <div className="flex items-center gap-3 mb-2 text-emerald-400/80">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400/60">Resolved Decision</span>
                      </div>
                      <div className="text-xl text-white font-bold tracking-tight">
                        "{selectedLog.final_decision}"
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Structured Explanation Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6">
                <div className="xl:col-span-2 space-y-10">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                         <Brain className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Reasoning Core</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Autonomous Logic Reconstruction</p>
                      </div>
                      {loading && <div className="ml-auto w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                   </div>

                   {explanation ? (
                     <div className="space-y-10">
                        {/* Executive Summary */}
                        <div className="bg-indigo-500/10 p-8 rounded-[2rem] border border-indigo-500/20 relative group mt-4">
                           <div className="absolute -top-3.5 left-8 px-4 py-1.5 bg-indigo-500 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg z-20">Executive Summary</div>
                           <p className="text-xl text-indigo-100 font-medium leading-snug">
                             {explanation.summary}
                           </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Logic Steps */}
                           <div className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/80">
                              <div className="flex items-center gap-3 mb-6 text-slate-400">
                                 <List className="w-4 h-4" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Logical Deduction</span>
                              </div>
                              <ul className="space-y-4">
                                 {explanation.logic?.map((step, i) => (
                                   <li key={i} className="flex gap-4 items-start group">
                                      <span className="text-[10px] font-bold text-indigo-500/50 mt-1">0{i+1}</span>
                                      <p className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{step}</p>
                                   </li>
                                 ))}
                              </ul>
                           </div>

                           {/* Evidence */}
                           <div className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/80">
                              <div className="flex items-center gap-3 mb-6 text-slate-400">
                                 <Database className="w-4 h-4" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Retrieved Evidence</span>
                              </div>
                              <ul className="space-y-4">
                                 {explanation.evidence?.map((item, i) => (
                                   <li key={i} className="flex gap-4 items-start group">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500 mt-2"></div>
                                      <p className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{item}</p>
                                   </li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[2rem] text-slate-600 bg-slate-900/10">
                       <Brain className={`w-10 h-10 mb-4 text-slate-800 ${loading ? 'animate-pulse text-indigo-500/20' : ''}`} />
                       <p className="text-sm font-bold uppercase tracking-widest">{loading ? "Synchronizing Brain..." : "Select a trace to analyze"}</p>
                     </div>
                   )}
                </div>

                {/* Right Panel: Side Stats / Caveats */}
                <div className="space-y-6">
                   <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-8 rounded-[2rem] border border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Integrity Metrics</h4>
                      <div className="space-y-6">
                         <div>
                            <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-bold text-slate-400">Faithfulness</span>
                               <span className="text-xs font-black text-emerald-400">95%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{width: '95%'}}></div>
                            </div>
                         </div>
                         <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3 text-slate-400 mb-3">
                               <Info className="w-3 h-3" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Caveats</span>
                            </div>
                            <ul className="space-y-3">
                               {explanation?.caveats?.map((c, i) => (
                                 <li key={i} className="text-[10px] leading-relaxed text-slate-500 italic">• {c}</li>
                               ))}
                            </ul>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-900/20 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                         <Shield className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Immutability</p>
                      <p className="text-[9px] text-slate-600 font-medium">Record protected by SQLite hardware triggers.</p>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[85vh] flex flex-col items-center justify-center text-center">
               <div className="w-32 h-32 bg-slate-900/40 rounded-full flex items-center justify-center mb-8 border border-slate-800 shadow-2xl relative">
                  <div className="absolute inset-0 bg-indigo-500/5 animate-pulse rounded-full"></div>
                  <Brain className="w-12 h-12 text-slate-700" />
               </div>
               <h3 className="text-3xl font-black text-slate-400 mb-3 tracking-tight">STANDBY MODE</h3>
               <p className="text-slate-600 max-w-sm text-sm leading-relaxed font-medium uppercase tracking-widest">Awaiting decision selection for deep-trace reconstruction.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
