"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Medal, Crown, Loader2, Users, ArrowLeft, User, Zap, Layout } from "lucide-react";
import { fetchEventLeaderboard, fetchEvent, fetchPersonalStanding } from "@/lib/api";

export default function EventLeaderboardPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [event, setEvent] = useState<any>(null);
    const [personalStanding, setPersonalStanding] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [lbData, evData] = await Promise.all([
                    fetchEventLeaderboard(eventId),
                    fetchEvent(eventId),
                ]);
                setLeaderboard(lbData);
                setEvent(evData);

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
        }
        load();
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const getRankIcon = (rank: number) => {
        switch (parseInt(rank.toString())) {
            case 1: return <Crown className="w-5 h-5 text-amber-400" />;
            case 2: return <Medal className="w-5 h-5 text-slate-300" />;
            case 3: return <Medal className="w-5 h-5 text-amber-700" />;
            default: return <span className="text-slate-500 font-mono">{rank}</span>;
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push(`/events/${eventId}/challenges`)}
                        className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to event hub</span>
                    </button>
                </div>

                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-2">
                        <Trophy className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-blue-500 text-xs font-black uppercase tracking-[0.2em] mb-2">
                            <Layout className="w-4 h-4" /> Global Standings
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{event?.name}</h1>
                        <p className="text-slate-400 font-light italic text-lg max-w-xl mx-auto pt-2">{event?.description}</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800 overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/50">
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest w-24">Rank</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Developer</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Aggregate Score</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Total Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {leaderboard.length > 0 ? (
                                    leaderboard.map((entry, index) => (
                                        <tr
                                            key={entry.dev_id}
                                            className={`transition-all hover:bg-slate-800/30 ${index < 3 ? 'bg-blue-500/5' : ''}`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-950 border border-slate-800">
                                                    {getRankIcon(entry.rank)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-bold text-white tracking-tight leading-none mb-1">{entry.name}</span>
                                                    <span className="text-slate-500 text-xs font-mono">@{entry.dev_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Medal className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xl font-black italic text-blue-400 font-mono">{entry.total_score}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Zap className="w-4 h-4 text-slate-600" />
                                                    <span className="font-mono">{entry.total_time}s</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center space-y-4 opacity-50">
                                                <Users className="w-14 h-14 text-slate-700" />
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 font-bold italic uppercase tracking-widest">No Submissions Yet</p>
                                                    <p className="text-slate-600 text-sm italic">Be the first to claim the throne!</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {personalStanding && (
                    <div className="bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/5">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-500 text-emerald-950 rounded-full flex items-center justify-center font-black italic text-3xl shadow-2xl shadow-emerald-500/20 border-4 border-emerald-400/20">
                                #{personalStanding.rank}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black italic text-emerald-100 uppercase tracking-tight flex items-center gap-2">
                                    <User className="w-6 h-6" /> Your Standing
                                </h3>
                                <p className="text-emerald-500/70 font-mono">@{personalStanding.dev_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-16">
                            <div className="text-center md:text-right">
                                <div className="text-emerald-400 font-black italic text-3xl flex items-center gap-2 justify-center md:justify-end">
                                    <Medal className="w-6 h-6" /> {personalStanding.total_score}
                                </div>
                                <p className="text-[10px] text-emerald-500/50 uppercase font-black tracking-[0.2em] mt-2">Aggregate Score</p>
                            </div>
                            <div className="text-center md:text-right">
                                <div className="text-slate-300 font-mono text-3xl flex items-center gap-2 justify-center md:justify-end">
                                    <Zap className="w-6 h-6 text-emerald-500" /> {personalStanding.total_time}s
                                </div>
                                <p className="text-[10px] text-emerald-500/50 uppercase font-black tracking-[0.2em] mt-2">Total Time</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center pt-8">
                    <p className="text-slate-600 text-xs uppercase font-black tracking-[0.3em] italic">
                        Real-time Arena Metrics • High Performance Competition
                    </p>
                </div>
            </div>
        </main>
    );
}
