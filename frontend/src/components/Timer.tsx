"use client";

import { useState, useEffect } from "react";
import { Timer as TimerIcon } from "lucide-react";

export default function Timer({ startTime }: { startTime: Date }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setElapsed(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
            <TimerIcon className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="font-mono text-xl text-blue-400 font-bold">
                {formatTime(elapsed)}
            </span>
        </div>
    );
}
