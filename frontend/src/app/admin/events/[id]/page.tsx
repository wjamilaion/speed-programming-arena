"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trophy, Clock, FileCode, Save, Loader2, Trash2, Zap } from "lucide-react";
import { fetchEvent, createChallenge } from "@/lib/api";

export default function EventDetails({ params }: { params: { id: string } }) {
    const eventId = params.id;
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
        title: "",
        description: "",
        time_limit_minutes: 30,
        starter_code: "",
        runner_id: "",
    });
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const loadEvent = async () => {
        try {
            const data = await fetchEvent(eventId);
            setEvent(data);
        } catch (err) {
            console.error("Failed to load event", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/admin/login");
            return;
        }
        loadEvent();
    }, [eventId, router]);

    const handleAddChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createChallenge({
                ...newChallenge,
                event_id: eventId,
            });
            setShowAddModal(false);
            setNewChallenge({ title: "", description: "", time_limit_minutes: 30, starter_code: "", runner_id: "" });
            loadEvent();
        } catch (err) {
            console.error("Failed to add challenge", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading context...</div>;
    if (!event) return <div className="p-8 text-red-500">Event not found.</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.push("/admin/dashboard")}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </button>

                <header className="flex justify-between items-end mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-500 font-bold tracking-widest text-xs uppercase">
                            <Trophy className="w-4 h-4" /> Competition Event
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tight">{event.name}</h1>
                        <p className="text-slate-400 max-w-2xl">{event.description}</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-blue-500/10 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Add Challenge
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {event.challenges?.length === 0 ? (
                        <div className="col-span-2 p-12 border-2 border-dashed border-slate-800 rounded-3xl text-center text-slate-600">
                            No challenges added to this event yet.
                        </div>
                    ) : (
                        event.challenges.map((challenge: any) => (
                            <div key={challenge.id} className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold tracking-tight">{challenge.title}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                        <Clock className="w-3 h-3" /> {challenge.time_limit_minutes}m
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-3 font-light leading-relaxed">
                                    {challenge.description}
                                </p>
                                <div className="pt-2 flex items-center justify-between">
                                    <span className="text-xs font-mono text-slate-600">{challenge.id}</span>
                                    <button className="text-slate-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Challenge Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <header className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Plus className="w-6 h-6 text-blue-500" /> New Challenge
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </header>

                        <form onSubmit={handleAddChallenge} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Trophy className="w-3 h-3" /> Title</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={newChallenge.title}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Time Limit (min)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={newChallenge.time_limit_minutes}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, time_limit_minutes: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileCode className="w-3 h-3" /> Starter ZIP URL</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="https://example.com/starter.zip"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={newChallenge.starter_code}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, starter_code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3" /> Runner ID (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. problem-1"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={newChallenge.runner_id}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, runner_id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Description / Instructions</label>
                                <textarea
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[150px]"
                                    value={newChallenge.description}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Challenge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
