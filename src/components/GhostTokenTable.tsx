'use client';

import React from 'react';

interface GhostToken {
    mint: string;
    daysDormant: number;
    awakenedAt: string;
    recentTransferAmount: string;
    from: string;
    to: string;
}

interface Props {
    data: GhostToken[];
}

export const GhostTokenTable: React.FC<Props> = ({ data }) => {
    if (!data.length) {
        return (
            <div className="p-4 text-center text-gray-500 italic">
                No ghost tokens awakened yet... 💤
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-700 mt-4">
            <table className="min-w-full text-sm text-left bg-black text-gray-200">
                <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                    <tr>
                        <th className="px-4 py-2">Mint</th>
                        <th className="px-4 py-2">Days Dormant</th>
                        <th className="px-4 py-2">Awakened At</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2">From</th>
                        <th className="px-4 py-2">To</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((token, idx) => (
                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800 transition">
                            <td className="px-4 py-2 font-mono truncate max-w-[120px]">{token.mint}</td>
                            <td className="px-4 py-2">{token.daysDormant}</td>
                            <td className="px-4 py-2">{new Date(token.awakenedAt).toLocaleString()}</td>
                            <td className="px-4 py-2">{token.recentTransferAmount}</td>
                            <td className="px-4 py-2 font-mono truncate max-w-[120px]">{token.from}</td>
                            <td className="px-4 py-2 font-mono truncate max-w-[120px]">{token.to}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
