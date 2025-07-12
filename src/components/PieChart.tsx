'use client';

import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#22d3ee', '#facc15', '#34d399', '#f87171', '#c084fc'];

export default function PieChart({ data }: { data: { name: string, value: number }[] }) {
    if (!data || data.length === 0) {
        return <div className="text-center text-slate-500 py-8">No data to display.</div>;
    }

    return (
        <div className="w-full h-80">
            <ResponsiveContainer>
                <RePieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                </RePieChart>
            </ResponsiveContainer>
        </div>
    );
}
