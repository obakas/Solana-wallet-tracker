'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#22d3ee', '#facc15', '#34d399', '#f87171', '#c084fc'];

export default function TokenChart({ data }: { data: { mint: string, amount: number, symbol: string }[] }) {
    const filtered = data.filter(t => t.amount > 0);

    const pieData = filtered.map((token, index) => ({
        name: token.symbol || token.mint.slice(0, 6) + '...',
        value: token.amount,
    }));

    if (pieData.length === 0) {
        return <div className="text-center text-slate-500 py-8">No token balances to display.</div>;
    }

    return (
        <div className="w-full h-80">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
