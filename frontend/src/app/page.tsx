"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, Trophy, Zap, User, AtSign, Hash, ArrowRight } from "lucide-react";

export default function Home() {
    const [identity, setIdentity] = useState({ name: "", handle: "", email: "" });
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("bugfix_identity");
        if (saved) {
            setIdentity(JSON.parse(saved));
            setIsSaved(true);
        }
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!identity.name || !identity.handle || !identity.email) return;
        localStorage.setItem("bugfix_identity", JSON.stringify(identity));
        setIsSaved(true);
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div className="max-w-4xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex justify-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Cpu className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <Zap className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <Trophy className="w-8 h-8 text-amber-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                        Speed <span className="text-blue-500">Bug-Fix</span> Arena
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
                        The ultimate arena for React & Next.js developers. Fix bugs, beat the clock, and climb the leaderboard.
                    </p>
                </div>

                {!isSaved ? (
                    <div className="max-w-md mx-auto w-full p-8 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Identify Yourself</h2>
                        <form onSubmit={handleSave} className="space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" /> Full Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Jane Doe"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={identity.name}
                                    onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="w-3 h-3" /> Developer Handle
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="janedev"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={identity.handle}
                                    onChange={(e) => setIdentity({ ...identity, handle: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <AtSign className="w-3 h-3" /> Email Address
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="jane@example.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={identity.email}
                                    onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-4 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Start Competing <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto">
                            <p className="text-sm text-slate-400">Welcome back,</p>
                            <p className="text-xl font-bold text-white mb-1">{identity.name}</p>
                            <p className="text-xs text-blue-400 font-mono tracking-tighter">@{identity.handle} • {identity.email}</p>
                            <button
                                onClick={() => setIsSaved(false)}
                                className="mt-4 text-xs text-slate-500 hover:text-white transition-colors"
                            >
                                Change Identity
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 auto-cols-max">
                            <Link
                                href="/events"
                                className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all hover:scale-105 shadow-xl shadow-blue-500/25 active:scale-95 flex items-center gap-2"
                            >
                                Explorer Events <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-2">1. Download</h3>
                        <p className="text-slate-400 text-sm">Download the broken starter code for a specific React challenge.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-2">2. Fix Logic</h3>
                        <p className="text-slate-400 text-sm">Fix all the bugs locally ensuring all hidden requirements are met.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-2">3. Upload ZIP</h3>
                        <p className="text-slate-400 text-sm">Upload your fix as a ZIP file. Our Docker worker evaluates it instantly.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
