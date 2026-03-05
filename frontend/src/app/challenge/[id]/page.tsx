"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, CheckCircle2, XCircle, Loader2, Trophy, Clock, History } from "lucide-react";
import Timer from "@/components/Timer";
import Dropzone from "@/components/Dropzone";
import { fetchChallenge, submitSolution, fetchSubmissions } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function ChallengePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [challenge, setChallenge] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(new Date());
    const [solutionFile, setSolutionFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<"idle" | "running" | "accepted" | "rejected">("idle");
    const [result, setResult] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [data, subs] = await Promise.all([
                    fetchChallenge(id),
                    fetchSubmissions(id)
                ]);
                setChallenge(data);
                setSubmissions(subs);
            } catch (err) {
                setError("Failed to load challenge data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    useEffect(() => {
        const identityStr = localStorage.getItem("bugfix_identity");
        if (!identityStr) {
            router.push("/");
            return;
        }

        const socket = getSocket();
        const identity = JSON.parse(identityStr);

        // Fetch user object from backend to get the actual UUID for WebSocket channel
        // Since we findOrCreate in AuthGuard, the user exists now.
        // We'll use a hack for MVP: listen on handle since it's unique enough or fetch real ID.
        // Let's use the handle for now as the WS identifier in the gateway.
        socket.on(`user:${identity.handle}:result`, (data) => {
            if (data.challengeId === id) {
                setStatus(data.status);
                setResult(data);
                setIsSubmitting(false);
                // Refresh submissions list
                fetchSubmissions(id).then(setSubmissions);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [id, router]);

    const handleDownload = () => {
        if (!challenge) return;
        const blob = new Blob([challenge.starter_code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "useCounter.js";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async () => {
        if (!solutionFile || isSubmitting) return;

        setIsSubmitting(true);
        setStatus("running");
        setError(null);

        const formData = new FormData();
        formData.append("challengeId", id);
        formData.append("solution", solutionFile);
        formData.append("startedAt", startTime.toISOString());

        try {
            await submitSolution(formData, challenge.event_id);
            // Wait for WebSocket for result
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
            setStatus("idle");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error && !challenge) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Error</h1>
                <p className="text-slate-400">{error}</p>
                <button onClick={() => router.push("/")} className="mt-6 text-blue-500 hover:underline">
                    Go back home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => challenge.event_id ? router.push(`/events/${challenge.event_id}/challenges`) : router.push("/events")}
                        className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-1.5"
                    >
                        ← Back to arena
                    </button>
                    <h1 className="text-4xl font-bold text-white">{challenge.title}</h1>
                    <p className="text-slate-400 max-w-2xl">{challenge.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Time Elapsed</span>
                    <Timer startTime={startTime} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Instructions & Download */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-lg font-semibold text-white">1. Get Started</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Download the broken starter code and fix all the bugs locally.
                            Ensure your solution handles all the test cases mentioned in the description.
                        </p>
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Starter Code</span>
                        </button>
                    </div>

                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Challenge Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Limit</span>
                                <p className="text-white font-medium">{challenge.time_limit_minutes}m</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Difficulty</span>
                                <p className="text-emerald-500 font-medium">Medium</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Upload & Results */}
                <div className="lg:col-span-2 space-y-8">
                    {status === "idle" || status === "running" ? (
                        <div className="space-y-6">
                            <Dropzone onFileSelect={setSolutionFile} />

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!solutionFile || isSubmitting}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 ${!solutionFile || isSubmitting
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                                    }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Running Tests...</span>
                                    </div>
                                ) : (
                                    "Submit Solution"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-3xl border-2 animate-in zoom-in-95 duration-500 ${status === "accepted"
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                            : "bg-red-500/5 border-red-500/20 text-red-500"
                            }`}>
                            <div className="flex flex-col items-center text-center space-y-4">
                                {status === "accepted" ? (
                                    <>
                                        <div className="p-4 bg-emerald-500 rounded-full text-white shadow-xl shadow-emerald-500/20 mb-2">
                                            <CheckCircle2 className="w-12 h-12" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Accepted</h2>
                                        <p className="text-slate-400">Great job! All hidden tests passed successfully.</p>

                                        <div className="grid grid-cols-2 gap-8 w-full max-w-sm pt-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs uppercase mb-1">
                                                    <Trophy className="w-3 h-3" />
                                                    <span>Final Score</span>
                                                </div>
                                                <p className="text-4xl font-black text-white">{result?.score}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs uppercase mb-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Time taken</span>
                                                </div>
                                                <p className="text-4xl font-black text-white">{result?.time_taken_seconds}s</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-red-500 rounded-full text-white shadow-xl shadow-red-500/20 mb-2">
                                            <XCircle className="w-12 h-12" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Rejected</h2>
                                        <p className="text-slate-400">Your solution failed one or more hidden tests. Try again!</p>
                                    </>
                                )}

                                <div className="pt-8 w-full flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => { setStatus("idle"); setSolutionFile(null); setResult(null); }}
                                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => router.push(`/leaderboard/${id}`)}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25"
                                    >
                                        View Leaderboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submissions History */}
                    <div className="space-y-6 pt-12 border-t border-slate-900">
                        <div className="flex items-center space-x-3">
                            <History className="w-5 h-5 text-slate-500" />
                            <h3 className="text-xl font-bold text-white">Recent Submissions</h3>
                        </div>

                        {submissions.length === 0 ? (
                            <div className="p-8 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-center">
                                <p className="text-slate-500">No submissions yet for this challenge.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {submissions.map((sub: any) => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${sub.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                                                sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {sub.status === 'accepted' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    sub.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                                                        <Loader2 className="w-5 h-5 animate-spin" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-white">Attempt #{sub.attempt_number}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${sub.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {sub.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{sub.time_taken_seconds}s</span>
                                                    </div>
                                                    <span>•</span>
                                                    <span>{new Date(sub.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white">{sub.score}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Points</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
