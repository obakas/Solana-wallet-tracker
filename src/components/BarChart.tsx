'use client';

import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
} from 'recharts';

export default function BarChart({ data }: { data: { name: string; value: number }[] }) {
    if (!data || data.length === 0) {
        return <div className="text-center text-slate-500 py-8">No data to display.</div>;
    }

    return (
        <div className="w-full h-80">
            <ResponsiveContainer>
                <ReBarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8b5cf6" />
                </ReBarChart>
            </ResponsiveContainer>
        </div>
    );
}
