"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trophy, ChevronRight, Activity, Clock, ArrowLeft } from "lucide-react";
import { fetchEvents } from "@/lib/api";

export default function EventsExplorer() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const router = useRouter();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await fetchEvents();
                setEvents(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();

        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getStatus = (start: string, end: string) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        if (now < startTime) return "upcoming";
        if (now > endTime) return "past";
        return "live";
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Scanning for arenas...</div>;

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-12">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>

                <header className="space-y-4">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                        Arena <span className="text-blue-500">Explorer</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-light max-w-xl">
                        Select an event to enter the challenge arena and start climbing the leaderboards.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {events.length === 0 ? (
                        <div className="p-12 border border-slate-800 rounded-3xl text-center text-slate-600 italic">
                            No active events found. Check back later!
                        </div>
                    ) : (
                        events.map((event) => {
                            const status = getStatus(event.start_time, event.end_time);
                            return (
                                <div
                                    key={event.id}
                                    onClick={() => status !== "upcoming" && router.push(`/events/${event.id}/challenges`)}
                                    className={`group relative p-8 bg-slate-900/40 border rounded-3xl transition-all overflow-hidden ${status === "live"
                                        ? "border-blue-500/50 hover:bg-slate-900/60 cursor-pointer shadow-2xl shadow-blue-500/5"
                                        : status === "upcoming"
                                            ? "border-slate-800 opacity-60 cursor-not-allowed"
                                            : "border-slate-800 hover:bg-slate-900/60 cursor-pointer"
                                        }`}
                                >
                                    {status === "live" && (
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="flex items-center gap-2 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse uppercase tracking-widest">
                                                <Activity className="w-3 h-3" /> Live
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <h2 className="text-2xl font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{event.name}</h2>
                                                <p className="text-slate-500 font-light line-clamp-2 max-w-lg">{event.description}</p>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm text-slate-400 italic">
                                                <span className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-600" />
                                                    {status === "upcoming"
                                                        ? `Starts ${new Date(event.start_time).toLocaleString()}`
                                                        : status === "live"
                                                            ? "Ending soon..."
                                                            : `Ended ${new Date(event.end_time).toLocaleDateString()}`}
                                                </span>
                                                <span className="flex items-center gap-2 text-slate-600">
                                                    <Trophy className="w-3.5 h-3.5" />
                                                    {event.challenges?.length || 0} Problems
                                                </span>
                                            </div>
                                        </div>

                                        {status !== "upcoming" && (
                                            <div className="flex flex-col items-end gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/events/${event.id}/challenges`);
                                                    }}
                                                    className="flex items-center gap-3 text-blue-500 font-bold group-hover:translate-x-2 transition-transform"
                                                >
                                                    Enter Arena <ChevronRight className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/leaderboard/event/${event.id}`);
                                                    }}
                                                    className="flex items-center gap-3 text-slate-500 hover:text-blue-400 text-xs font-black uppercase tracking-widest transition-colors"
                                                >
                                                    <Trophy className="w-4 h-4" /> Leaderboard
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
