"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { History, ArrowLeft, Loader2, User, Mail, Zap, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { fetchEvent, fetchEventSubmissions } from "@/lib/api";

export default function EventSubmissionsPage() {
    const params = useParams();
    const eventId = params.id as string;
    const router = useRouter();

    const [event, setEvent] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [eventData, subsData] = await Promise.all([
                    fetchEvent(eventId),
                    fetchEventSubmissions(eventId)
                ]);
                setEvent(eventData);
                setSubmissions(subsData);
            } catch (err) {
                console.error("Failed to load submission history", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [eventId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin" />
                    <History className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500" />
                </div>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Decrypting History...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-blue-500/30">
            <div className="max-w-[1400px] mx-auto p-6 md:p-12 space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Event
                        </button>
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
                            Submission <span className="text-blue-500">History</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-blue-500" />
                                <span className="font-bold text-white uppercase tracking-wider">{event?.name}</span>
                            </div>
                            {event?.organized_by && (
                                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                    By {event.organized_by}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-slate-900/20 border border-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50 bg-slate-900/40">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Time</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Participant</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Challenge</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="group hover:bg-slate-800/20 transition-colors">
                                        <td className="px-8 py-8">
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold text-white">
                                                    {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] font-medium text-slate-600 uppercase tracking-tighter">
                                                    {new Date(sub.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                                    <User className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">
                                                        {sub.user?.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                        <Mail className="w-3 h-3 text-slate-600" />
                                                        <span className="text-xs font-mono text-slate-500">{sub.user?.email || "No email"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-700/50">
                                                    {sub.challenge?.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex justify-center">
                                                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] ${sub.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' :
                                                        sub.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                                                    }`}>
                                                    {sub.status === 'accepted' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                        sub.status === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> :
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                    {sub.status}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="space-y-1">
                                                <div className={`text-2xl font-black italic tracking-tighter ${sub.status === 'accepted' ? 'text-white' : 'text-slate-700'}`}>
                                                    {sub.score}
                                                </div>
                                                <div className="flex items-center justify-end gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                    <Zap className="w-3 h-3" /> {sub.time_taken_seconds}s
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {submissions.length === 0 && (
                            <div className="p-24 text-center space-y-4">
                                <History className="w-12 h-12 text-slate-800 mx-auto" />
                                <p className="text-slate-500 italic font-light">No submissions recorded for this event.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center pb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Arena Submission Log v1.0.42</p>
                </div>
            </div>
        </div>
    );
}
