import React from 'react';

export default function TraceTable({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-sm">
                <thead>
                    <tr className="bg-slate-700 text-slate-300">
                        <th className="px-4 py-2 text-left">From</th>
                        <th className="px-4 py-2 text-left">To</th>
                        <th className="px-4 py-2 text-left">Token</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((tx, i) => (
                        <tr key={tx.id || i} className="hover:bg-slate-700/50 border-t border-slate-600">
                            <td className="px-4 py-2 font-mono">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</td>
                            <td className="px-4 py-2 font-mono">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</td>
                            <td className="px-4 py-2">{tx.token}</td>
                            <td className="px-4 py-2 text-right">{tx.amount.toFixed(4)}</td>
                            <td className="px-4 py-2">{new Date(tx.date).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
