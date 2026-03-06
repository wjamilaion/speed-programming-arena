"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Clock, ArrowRight, ArrowLeft, Layout, Medal, Zap, User, ChevronRight, History } from "lucide-react";
import { fetchEvent, fetchEventLeaderboard, fetchPersonalStanding } from "@/lib/api";
import SubmissionsFeed from "@/components/SubmissionsFeed";
import Link from "next/link";

export default function EventChallenges({ params }: { params: { id: string } }) {
    const eventId = params.id;
    const [event, setEvent] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [personalStanding, setPersonalStanding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadData = async () => {
        try {
            const [eventData, lbData] = await Promise.all([
                fetchEvent(eventId),
                fetchEventLeaderboard(eventId)
            ]);
            setEvent(eventData);
            setLeaderboard(lbData);

            // Fetch personal standing if identity exists
            const identityStr = localStorage.getItem("bugfix_identity");
            if (identityStr) {
                const identity = JSON.parse(identityStr);
                const handle = identity.handle;
                if (handle) {
                    const standing = await fetchPersonalStanding(eventId, handle);
                    setPersonalStanding(standing);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [eventId]);

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Entering the Arena...</div>;
    if (!event) return <div className="p-12 text-center text-red-500">Event not found.</div>;

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                <button
                    onClick={() => router.push("/events")}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Events
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-900 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500 text-xs font-black uppercase tracking-[0.2em]">
                            <Layout className="w-4 h-4" /> Challenge Hub
                        </div>
                        <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">{event.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-500">
                            {event.organized_by && (
                                <div className="text-blue-500">By {event.organized_by}</div>
                            )}
                            {event.organized_by && <span className="text-slate-800">•</span>}
                            <div>{event.description}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 px-6 py-4 rounded-3xl border border-slate-800 backdrop-blur-xl shrink-0">
                        <div className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Status</div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold italic tracking-tight">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> LIVE NOW
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-xl font-black italic uppercase tracking-widest flex items-center gap-2 text-slate-500">
                            Available Problems <ArrowRight className="w-4 h-4" />
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {event.challenges?.map((challenge: any, idx: number) => (
                                <div
                                    key={challenge.id}
                                    onClick={() => router.push(`/challenge/${challenge.id}`)}
                                    className="group p-8 bg-slate-900/30 border border-slate-800 rounded-[2.5rem] hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between min-h-[300px] hover:bg-slate-900/40"
                                >
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-black italic text-lg text-slate-500 group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all">
                                                {idx + 1}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 uppercase">
                                                <Clock className="w-3 h-3" /> {challenge.time_limit_minutes}m
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black italic uppercase tracking-tight group-hover:text-blue-400 transition-colors">{challenge.title}</h3>
                                            <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-3">
                                                {challenge.description}
                                            </p>
                                        </div>
                                    </div>

                                    <button className="mt-8 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-all">
                                        Launch Arena <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="space-y-8">
                        <h2 className="text-xl font-black italic uppercase tracking-widest flex items-center gap-2 text-blue-500">
                            <Trophy className="w-5 h-5" /> Global Standings
                        </h2>
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                            {leaderboard.length === 0 ? (
                                <div className="p-12 text-center text-slate-600 italic text-sm">
                                    No submissions yet. Be the first to climb!
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {leaderboard.map((entry, idx) => (
                                        <div key={idx} className="p-5 flex items-center justify-between group hover:bg-slate-900/60 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic text-xs ${idx === 0 ? "bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20" :
                                                    idx === 1 ? "bg-slate-300 text-slate-900" :
                                                        idx === 2 ? "bg-amber-700 text-amber-100" :
                                                            "bg-slate-800 text-slate-500"
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold tracking-tight text-sm uppercase">{entry.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-600">@{entry.dev_id}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-blue-500 font-black italic text-sm flex items-center gap-1.5 justify-end">
                                                    <Medal className="w-3.5 h-3.5" /> {entry.total_score}
                                                </div>
                                                <div className="text-[10px] text-slate-600 font-light flex items-center gap-1 justify-end">
                                                    <Zap className="w-3 h-3 text-slate-700" /> {entry.total_time}s
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {leaderboard.length > 0 && (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/events/${eventId}/submissions`}
                                    className="flex-1 py-4 bg-slate-900 border border-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <History className="w-4 h-4 group-hover:rotate-[-20deg] transition-transform" /> History
                                </Link>
                                <button
                                    onClick={() => router.push(`/leaderboard/event/${eventId}`)}
                                    className="flex-[2] py-4 bg-blue-500 border border-blue-600 rounded-3xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95"
                                >
                                    <Trophy className="w-4 h-4" /> Leaderboard
                                </button>
                            </div>
                        )}

                        {personalStanding && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-black italic uppercase tracking-widest flex items-center gap-2 text-emerald-500">
                                    <User className="w-5 h-5" /> Your Standing
                                </h2>
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 text-emerald-950 rounded-full flex items-center justify-center font-black italic text-xl shadow-lg shadow-emerald-500/20">
                                            #{personalStanding.rank}
                                        </div>
                                        <div>
                                            <div className="font-bold tracking-tight uppercase text-emerald-100">You</div>
                                            <div className="text-xs font-mono text-emerald-500/70">@{personalStanding.dev_id}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-black italic text-xl flex items-center gap-1.5 justify-end">
                                            <Medal className="w-4 h-4" /> {personalStanding.total_score}
                                        </div>
                                        <div className="text-xs text-emerald-500/50 font-light flex items-center gap-1 justify-end">
                                            <Zap className="w-3.5 h-3.5" /> {personalStanding.total_time}s
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Scoring Rules</p>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                Total Score = Sum of highest score per challenge.<br />
                                Tie-break = Lowest total time taken for accepted solutions.
                            </p>
                        </div>

                        <div className="pt-8">
                            <SubmissionsFeed eventId={eventId} refreshInterval={15000} />
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
