"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Users, Trophy, ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import { fetchEvents } from "@/lib/api";

export default function AdminDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/admin/login");
            return;
        }

        const loadEvents = async () => {
            try {
                const data = await fetchEvents();
                setEvents(data);
            } catch (err) {
                console.error("Failed to load events", err);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Admin<span className="text-blue-500">Panel</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-blue-500/10 text-blue-500 rounded-xl font-medium flex items-center gap-3">
                        <Calendar className="w-4 h-4" /> Events
                    </button>
                    <button className="w-full text-left px-4 py-3 text-slate-400 hover:bg-slate-900 rounded-xl font-medium flex items-center gap-3 transition-colors">
                        <Users className="w-4 h-4" /> Participants
                    </button>
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors mt-auto"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Events Management</h1>
                        <p className="text-slate-400">Create and oversee your bug-fix competitions.</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin/events/new")}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Create New Event
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    {events.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-slate-800 rounded-3xl text-center">
                            <Calendar className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium text-lg">No events created yet.</p>
                            <button
                                onClick={() => router.push("/admin/events/new")}
                                className="mt-4 text-blue-500 hover:underline"
                            >
                                Start by creating your first event
                            </button>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => router.push(`/admin/events/${event.id}`)}
                                className="group p-6 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                                        <Trophy className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">{event.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(event.start_time).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> {event.challenges?.length || 0} Challenges</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
