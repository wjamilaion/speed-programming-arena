"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowLeft, Loader2, Save } from "lucide-react";
import { createEvent } from "@/lib/api";

export default function NewEvent() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createEvent({
                name,
                description,
                start_time: new Date(startTime),
                end_time: new Date(endTime),
            });
            router.push("/admin/dashboard");
        } catch (err) {
            console.error("Failed to create event", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </button>

                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20">
                        <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Create New Event</h1>
                        <p className="text-slate-400">Set up a new bug-fix competition.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Event Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Winter Code Rush 2026"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-lg"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                            <textarea
                                placeholder="What is this event about?"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[120px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-6 h-6" /> Save & Continue
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
