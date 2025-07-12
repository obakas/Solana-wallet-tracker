import React from 'react';

interface TokenData {
    name: string;
    symbol: string;
    mint: string;
    amount: number;
    decimals: number;
}

interface TokenTableProps {
    data: TokenData[];
}

const TokenTable: React.FC<TokenTableProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-slate-400">No token data available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-slate-700">
                <thead className="bg-slate-800">
                    <tr>
                        <th className="border border-slate-700 px-4 py-2 text-left">Name</th>
                        <th className="border border-slate-700 px-4 py-2 text-left">Symbol</th>
                        <th className="border border-slate-700 px-4 py-2 text-left">Mint Address</th>
                        <th className="border border-slate-700 px-4 py-2 text-right">Amount</th>
                        <th className="border border-slate-700 px-4 py-2 text-right">Decimals</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((token, index) => (
                        <tr key={index} className="hover:bg-slate-700">
                            <td className="border border-slate-700 px-4 py-2">{token.name || 'N/A'}</td>
                            <td className="border border-slate-700 px-4 py-2">{token.symbol || 'N/A'}</td>
                            <td className="border border-slate-700 px-4 py-2 text-xs break-all">{token.mint}</td>
                            <td className="border border-slate-700 px-4 py-2 text-right">{token.amount}</td>
                            <td className="border border-slate-700 px-4 py-2 text-right">{token.decimals}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TokenTable;
