"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, XCircle, Loader2, Clock, Zap, User } from "lucide-react";
import { fetchRecentSubmissions } from "@/lib/api";

interface SubmissionFeedProps {
    eventId?: string;
    challengeId?: string;
    refreshInterval?: number;
    title?: string;
}

export default function SubmissionsFeed({ eventId, challengeId, refreshInterval = 10000, title = "Live Activity" }: SubmissionFeedProps) {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSubmissions = async () => {
        try {
            const data = await fetchRecentSubmissions(eventId, challengeId);
            setSubmissions(data);
        } catch (err) {
            console.error("Failed to load global submissions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
        const timer = setInterval(loadSubmissions, refreshInterval);
        return () => clearInterval(timer);
    }, [eventId, challengeId, refreshInterval]);

    if (loading && submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 opacity-50">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Connecting to feed...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-500" /> {title}
                </h3>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live</span>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className="p-12 bg-slate-900/30 rounded-[2rem] border border-dashed border-slate-800 text-center">
                    <p className="text-slate-500 italic font-light">The arena is quiet... for now.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {submissions.map((sub: any) => (
                        <div
                            key={sub.id}
                            className="flex items-center justify-between p-5 bg-slate-900/40 border border-slate-800 rounded-3xl hover:bg-slate-900/60 hover:border-slate-700 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-2xl ${sub.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 shadow-xl shadow-emerald-500/5' :
                                    sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {sub.status === 'accepted' ? <CheckCircle2 className="w-5 h-5" /> :
                                        sub.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                                            <Loader2 className="w-5 h-5 animate-spin" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-slate-500" /> {sub.user?.name}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-mono">@{sub.user?.dev_id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-blue-500 font-black italic uppercase tracking-tighter">{sub.challenge?.title}</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-slate-500 italic">{new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <div className={`font-black italic text-lg leading-none ${sub.status === 'accepted' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {sub.score}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-black uppercase tracking-widest whitespace-nowrap">
                                    <Zap className="w-2.5 h-2.5" /> {sub.time_taken_seconds}s
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
