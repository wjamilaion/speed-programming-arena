"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Cpu, ArrowRight, Loader2 } from "lucide-react";
import { adminLogin } from "@/lib/api";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await adminLogin(password);
            localStorage.setItem("admin_token", data.token);
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20 shadow-2xl shadow-blue-500/5">
                        <Cpu className="w-12 h-12 text-blue-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Admin <span className="text-blue-500">Arena</span>
                    </h1>
                    <p className="text-slate-400 font-light">
                        Authorized access only. Enter the arena secret.
                    </p>
                </div>

                <div className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-3 h-3" /> Arena Secret
                            </label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Unlock Access <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-sm text-slate-600">
                    Not an admin? <button onClick={() => router.push("/")} className="text-slate-400 hover:text-white underline underline-offset-4 transition-colors">Return to Home</button>
                </p>
            </div>
        </main>
    );
}
