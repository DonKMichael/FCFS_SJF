/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Plus, Play, Trash2, RotateCcw, Activity, ListOrdered, Table as TableIcon, Clock, Edit2, Check, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
}

interface ResultProcess extends Process {
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  startTime: number;
  color: string;
}

interface GanttBlock {
  id: string;
  start: number;
  end: number;
  color: string;
  isIdle: boolean;
}

const COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-pink-500',
];

export default function App() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<'FCFS' | 'SJF'>('SJF');
  const [results, setResults] = useState<ResultProcess[] | null>(null);
  const [ganttData, setGanttData] = useState<GanttBlock[] | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newProcess, setNewProcess] = useState<Process>({ id: '', arrivalTime: 0, burstTime: 1 });

  const handleAddProcess = () => {
    if (!newProcess.id.trim()) {
      setError("Process ID is required");
      return;
    }
    if (newProcess.arrivalTime < 0) {
      setError("Arrival Time cannot be less than 0");
      return;
    }
    if (newProcess.burstTime < 1) {
      setError("Burst Time must be at least 1");
      return;
    }
    
    setProcesses([...processes, newProcess]);
    setNewProcess({
      id: '',
      arrivalTime: 0,
      burstTime: 1
    });
    setError(null);
  };

  const removeProcess = (index: number) => {
    const newProcesses = processes.filter((_, i) => i !== index);
    setProcesses(newProcesses);
  };

  const updateProcess = (index: number, field: keyof Process, value: string | number) => {
    const newProcesses = [...processes];
    if (field === 'id') {
      newProcesses[index].id = value as string;
    } else {
      const val = parseInt(value as string);
      const finalVal = isNaN(val) ? 0 : val;
      newProcesses[index][field] = finalVal;
      
      if (field === 'arrivalTime' && finalVal < 0) {
        setError(`Process ${newProcesses[index].id}: Arrival Time cannot be less than 0`);
      } else if (field === 'burstTime' && finalVal < 1) {
        setError(`Process ${newProcesses[index].id}: Burst Time must be at least 1`);
      } else {
        setError(null);
      }
    }
    setProcesses(newProcesses);
  };

  const simulate = () => {
    if (processes.length === 0) return;

    // Validate all processes before simulation
    for (const p of processes) {
      if (p.arrivalTime < 0) {
        setError(`Process ${p.id}: Arrival Time cannot be less than 0`);
        return;
      }
      if (p.burstTime < 1) {
        setError(`Process ${p.id}: Burst Time must be at least 1`);
        return;
      }
    }
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const resultList: ResultProcess[] = [];
    const gantt: GanttBlock[] = [];
    let currentTime = 0;
    const completed: Set<string> = new Set();

    if (algorithm === 'FCFS') {
      sortedProcesses.forEach((p, index) => {
        if (currentTime < p.arrivalTime) {
          gantt.push({ id: 'Idle', start: currentTime, end: p.arrivalTime, color: 'bg-zinc-800', isIdle: true });
          currentTime = p.arrivalTime;
        }
        const startTime = currentTime;
        currentTime += p.burstTime;
        const ct = currentTime;
        const tat = ct - p.arrivalTime;
        const wt = tat - p.burstTime;

        resultList.push({
          ...p,
          startTime,
          completionTime: ct,
          turnaroundTime: tat,
          waitingTime: wt,
          color: COLORS[index % COLORS.length],
        });

        gantt.push({
          id: p.id,
          start: startTime,
          end: ct,
          color: COLORS[index % COLORS.length],
          isIdle: false,
        });
      });
    } else if (algorithm === 'SJF') {
      // Non-Preemptive SJF
      let processesToRun = [...processes];
      let colorIndex = 0;

      while (completed.size < processes.length) {
        const availableProcesses = processesToRun.filter(
          p => p.arrivalTime <= currentTime && !completed.has(p.id)
        );

        if (availableProcesses.length === 0) {
          const nextArrival = Math.min(
            ...processesToRun.filter(p => !completed.has(p.id)).map(p => p.arrivalTime)
          );
          gantt.push({ id: 'Idle', start: currentTime, end: nextArrival, color: 'bg-zinc-800', isIdle: true });
          currentTime = nextArrival;
          continue;
        }

        // Pick shortest burst time
        const selected = availableProcesses.reduce((prev, curr) => 
          curr.burstTime < prev.burstTime ? curr : prev
        );

        const startTime = currentTime;
        currentTime += selected.burstTime;
        const ct = currentTime;
        const tat = ct - selected.arrivalTime;
        const wt = tat - selected.burstTime;

        resultList.push({
          ...selected,
          startTime,
          completionTime: ct,
          turnaroundTime: tat,
          waitingTime: wt,
          color: COLORS[colorIndex % COLORS.length],
        });

        gantt.push({
          id: selected.id,
          start: startTime,
          end: ct,
          color: COLORS[colorIndex % COLORS.length],
          isIdle: false,
        });

        completed.add(selected.id);
        colorIndex++;
      }
    }

    setResults(resultList);
    setGanttData(gantt);
  };

  const reset = () => {
    setResults(null);
    setGanttData(null);
  };

  const avgWaitingTime = useMemo(() => {
    if (!results) return 0;
    return (results.reduce((acc, curr) => acc + curr.waitingTime, 0) / results.length).toFixed(2);
  }, [results]);

  const avgTurnaroundTime = useMemo(() => {
    if (!results) return 0;
    return (results.reduce((acc, curr) => acc + curr.turnaroundTime, 0) / results.length).toFixed(2);
  }, [results]);

  return (
    <div className="min-h-screen text-zinc-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <Cpu className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                CPU Scheduling Simulator
              </h1>
              <p className="text-zinc-400 mt-2 text-lg font-medium">High-fidelity analysis of scheduling algorithms.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setAlgorithm('FCFS')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  algorithm === 'FCFS' 
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                FCFS
              </button>
              <button
                onClick={() => setAlgorithm('SJF')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  algorithm === 'SJF' 
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                SJF (Non-Preemptive)
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={simulate}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-base font-black px-8 py-3.5 rounded-2xl flex items-center gap-3 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95 hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5 fill-current" />
                Simulate
              </button>
              <button
                onClick={reset}
                className="p-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 rounded-2xl border border-white/10 transition-all active:scale-95 hover:-translate-y-0.5"
                title="Reset Results"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <p className="text-sm text-red-400 font-bold flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {error}
              </p>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="space-y-8">
          {/* Top Row: Add Process & Gantt Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Add Process Form */}
            <div className="lg:col-span-4">
              <div className="glass-card glass-card-hover rounded-3xl p-8 h-full flex flex-col">
                <h2 className="text-2xl font-black flex items-center gap-3 mb-8 text-white">
                  <Plus className="w-6 h-6 text-emerald-500" />
                  Add Process
                </h2>
                <div className="flex-grow space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">ID</label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={newProcess.id}
                        onChange={(e) => {
                          setNewProcess({ ...newProcess, id: e.target.value });
                          setError(null);
                        }}
                        placeholder="e.g. P1"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Arrival</label>
                      <input
                        type="number"
                        autoComplete="off"
                        value={newProcess.arrivalTime}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setNewProcess({ ...newProcess, arrivalTime: isNaN(val) ? 0 : val });
                          setError(null);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Burst</label>
                      <input
                        type="number"
                        autoComplete="off"
                        value={newProcess.burstTime}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setNewProcess({ ...newProcess, burstTime: isNaN(val) ? 0 : val });
                          setError(null);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-zinc-500 italic">Enter process details manually above and click the button below to add it to the simulation queue.</p>
                </div>
                <button
                  onClick={handleAddProcess}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-900/20"
                >
                  <Plus className="w-4 h-4" />
                  Add to Queue
                </button>
              </div>
            </div>

            {/* Gantt Chart or Placeholder */}
            <div className="lg:col-span-8">
              {!results ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-white/5 rounded-[2rem] p-12 bg-white/[0.02] backdrop-blur-sm">
                  <Activity className="w-16 h-16 mb-6 opacity-10" />
                  <p className="text-xl font-bold text-zinc-500">Simulation Pending</p>
                  <p className="text-sm mt-2">Add processes and click simulate to visualize the execution.</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-[2rem] p-8 shadow-2xl overflow-hidden h-full flex flex-col"
                >
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
                    <Activity className="w-7 h-7 text-blue-500" />
                    Gantt Chart
                  </h3>
                  <div className="relative pt-4 pb-12 flex-grow flex items-center">
                    <div className="flex w-full gap-0.5">
                      {ganttData?.map((block, i) => {
                        const duration = block.end - block.start;
                        const totalDuration = ganttData[ganttData.length - 1].end;
                        const widthPercent = (duration / totalDuration) * 100;
                        
                        return (
                          <div 
                            key={i} 
                            className="relative group"
                            style={{ width: `${widthPercent}%` }}
                          >
                            <div
                              className={`h-16 flex items-center justify-center text-sm font-black border-zinc-900/50 transition-all rounded-lg shadow-inner ${block.color} ${block.isIdle ? 'opacity-20' : 'text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]'}`}
                            >
                              {widthPercent > 5 ? block.id : ''}
                            </div>
                            <div className="absolute -bottom-8 left-0 text-[10px] font-mono font-bold text-zinc-500">
                              {block.start}
                            </div>
                            {i === ganttData.length - 1 && (
                              <div className="absolute -bottom-8 right-0 text-[10px] font-mono font-bold text-zinc-500">
                                {block.end}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Row: Process Queue & Results Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Process Queue List */}
            <div className="lg:col-span-4 h-full">
              <div className="glass-card glass-card-hover rounded-3xl p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                    <ListOrdered className="w-7 h-7 text-blue-500" />
                    Process Queue
                  </h2>
                  <span className="text-xs bg-white/5 text-zinc-400 px-3 py-1 rounded-full border border-white/10 font-bold">
                    {processes.length} Total
                  </span>
                </div>

                {processes.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 px-3 mb-2 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                    <div className="col-span-2">ID</div>
                    <div className="col-span-3">Arrival</div>
                    <div className="col-span-3">Burst</div>
                    <div className="col-span-4 text-center">Actions</div>
                  </div>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {processes.length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                        <p className="text-xs">Queue is empty</p>
                      </div>
                    ) : (
                      processes.map((p, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="grid grid-cols-12 gap-2 items-center bg-zinc-800/20 p-2 rounded-lg border border-zinc-700/30 hover:border-zinc-600 transition-colors"
                        >
                          <div className="col-span-2">
                            <input
                              id={`p-id-${index}`}
                              type="text"
                              autoComplete="off"
                              value={p.id}
                              readOnly={editingIndex !== index}
                              onChange={(e) => updateProcess(index, 'id', e.target.value)}
                              className={`w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${editingIndex !== index ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              autoComplete="off"
                              value={p.arrivalTime}
                              readOnly={editingIndex !== index}
                              onChange={(e) => updateProcess(index, 'arrivalTime', e.target.value)}
                              className={`w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${editingIndex !== index ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              autoComplete="off"
                              value={p.burstTime}
                              readOnly={editingIndex !== index}
                              onChange={(e) => updateProcess(index, 'burstTime', e.target.value)}
                              className={`w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${editingIndex !== index ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                            />
                          </div>
                          <div className="col-span-4 flex gap-1">
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              className={`flex-1 ${editingIndex === index ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'} text-[10px] font-bold py-1 rounded-md transition-all flex items-center justify-center border border-zinc-700`}
                              title={editingIndex === index ? "Save" : "Edit"}
                            >
                              {editingIndex === index ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => removeProcess(index)}
                              className="flex-1 bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400 text-[10px] font-bold py-1 rounded-md transition-all flex items-center justify-center border border-zinc-700"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Results Table & Stats */}
            <div className="lg:col-span-8 h-full">
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10 h-full"
                >
                  {/* Results Table and Statistics Side-by-Side */}
                  <div className="flex flex-col xl:flex-row gap-10 items-stretch h-full">
                    <div className="glass-card rounded-[2rem] p-8 shadow-2xl overflow-hidden flex-grow w-full h-full flex flex-col">
                      <div className="overflow-x-auto flex-grow custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-zinc-500 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                              <th className="pb-4 font-bold">Process</th>
                              <th className="pb-4 font-bold">AT</th>
                              <th className="pb-4 font-bold">BT</th>
                              <th className="pb-4 font-bold">CT</th>
                              <th className="pb-4 font-bold">TAT</th>
                              <th className="pb-4 font-bold">WT</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {results.map((p, i) => (
                              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                <td className="py-4 font-bold">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${p.color}`}></span>
                                  {p.id}
                                </td>
                                <td className="py-4 text-zinc-400">{p.arrivalTime}</td>
                                <td className="py-4 text-zinc-400">{p.burstTime}</td>
                                <td className="py-4 text-zinc-400">{p.completionTime}</td>
                                <td className="py-4 font-mono text-emerald-400">{p.turnaroundTime}</td>
                                <td className="py-4 font-mono text-blue-400">{p.waitingTime}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Statistics (Vertical Bar on the side) */}
                    <div className="glass-card rounded-[2rem] p-8 shadow-2xl flex flex-col gap-10 min-w-[300px] w-full xl:w-fit justify-center">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                          <RotateCcw className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-black">Avg Turnaround</p>
                          <p className="text-5xl font-black text-emerald-400 mt-2 tabular-nums">{avgTurnaroundTime}</p>
                        </div>
                      </div>
                      <div className="h-px bg-white/5 w-full"></div>
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                          <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-black">Avg Waiting</p>
                          <p className="text-5xl font-black text-blue-400 mt-2 tabular-nums">{avgWaitingTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
