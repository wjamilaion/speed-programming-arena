"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Medal, Crown, Loader2, Users, ArrowLeft } from "lucide-react";
import { fetchLeaderboard, fetchChallenge } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function LeaderboardPage() {
    const { challengeId } = useParams<{ challengeId: string }>();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [challenge, setChallenge] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [lbData, chData] = await Promise.all([
                    fetchLeaderboard(challengeId),
                    fetchChallenge(challengeId),
                ]);
                setLeaderboard(lbData);
                setChallenge(chData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [challengeId]);

    useEffect(() => {
        const socket = getSocket();

        socket.emit("joinBoard", challengeId);

        socket.on("leaderboard:update", (data) => {
            if (data.challengeId === challengeId) {
                setLeaderboard(data.top10);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [challengeId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
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
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-10">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push(`/challenge/${challengeId}`)}
                    className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>Back to challenge</span>
                </button>
            </div>

            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-4">
                    <Trophy className="w-8 h-8 text-amber-500" />
                </div>
                <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
                <p className="text-slate-400">{challenge?.title}</p>
            </div>

            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Rank</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dev</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((entry, index) => (
                                    <tr
                                        key={entry.dev_id}
                                        className={`transition-colors hover:bg-slate-800/30 ${index < 3 ? 'bg-blue-500/5' : ''}`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-white font-semibold">{entry.name}</span>
                                                <span className="text-slate-500 text-xs font-mono">{entry.dev_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-lg font-bold text-blue-400 font-mono">{entry.score}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-slate-300 font-mono">{entry.time_taken_seconds}s</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                                                ACCEPTED
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center space-y-3 opacity-50">
                                            <Users className="w-12 h-12 text-slate-600" />
                                            <p className="text-slate-400">No submissions yet. Be the first!</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center">
                <p className="text-slate-500 text-sm">
                    Updates in real-time as solutions are evaluated.
                </p>
            </div>
        </div>
    );
}
