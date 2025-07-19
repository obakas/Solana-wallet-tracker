'use client';

import { useState } from 'react';

interface ClusterNode {
    id: string;
    group: number;
}

interface ClusterData {
    nodes: ClusterNode[];
    links: any[];
}

export default function ClusterTable({ data }: { data: ClusterData }) {
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

    const clusters = data.nodes.reduce((acc, node) => {
        const group = node.group ?? 0;
        if (!acc[group]) acc[group] = [];
        acc[group].push(node.id);
        return acc;
    }, {} as Record<number, string[]>);

    return (
        <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-700/30">
            <h2 className="text-lg font-semibold mb-4 text-white">Wallet Clusters</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(clusters).map(([groupId, addresses]) => (
                    <div key={groupId} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
                        <button
                            onClick={() => setExpandedGroup(expandedGroup === +groupId ? null : +groupId)}
                            className="flex justify-between items-center w-full text-left text-white font-medium"
                        >
                            <span>Cluster #{groupId}</span>
                            <span className="text-slate-400 text-sm">
                                {addresses.length} address{addresses.length !== 1 && 'es'}
                            </span>
                        </button>

                        {expandedGroup === +groupId && (
                            <ul className="mt-3 text-slate-300 text-sm space-y-1 max-h-48 overflow-y-auto pl-3">
                                {addresses.map((addr) => (
                                    <li key={addr} className="truncate">
                                        {addr}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
