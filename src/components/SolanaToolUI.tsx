"use client";

import { useState } from 'react';
import { Button } from './ui/Button';
import { FiCopy, FiExternalLink, FiSearch, FiDollarSign, FiAlertCircle, FiList, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import PieChart from './PieChart';
import BarChart from './BarChart';
import TokenTable from './TokenTable';
import TraceTable from './TraceTable';


export default function SolanaToolUI() {
    const [address, setAddress] = useState('');
    const [numTx, setNumTx] = useState('10');
    const [output, setOutput] = useState<{ type: 'success' | 'error'; content: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'balances' | 'memecoins' | 'transactions' | 'trace' | 'binance'>('balances');
    const [tokenData, setTokenData] = useState<any[]>([]);
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
    const [txChartData, setTxChartData] = useState<{ name: string; value: number }[]>([]);
    const [binanceChartData, setBinanceChartData] = useState<{ name: string; value: number }[]>([]);
    const [traceData, setTraceData] = useState<any[]>([]);





    const exportToCSV = () => {
        if (!output?.content) return;
        const blob = new Blob([output.content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `solana-report-${activeTab}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!output?.content) return;
        const doc = new jsPDF();
        const lines = output.content.split('\n');
        let y = 10;
        lines.forEach((line) => {
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
            doc.text(line, 10, y);
            y += 7;
        });
        doc.save(`solana-report-${activeTab}.pdf`);
    };

    const callEndpoint = async (endpoint: string) => {
        setLoading(true);
        setOutput({ type: 'success', content: 'Loading...' });

        try {
            const params = new URLSearchParams({ address });
            if (endpoint === 'transactions') params.append('numTx', numTx);
            if (endpoint === 'trace') params.append('depth', '3');

            const res = await fetch(`/api/${endpoint}?${params.toString()}`);

            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                const text = await res.text();
                throw new Error(`Invalid JSON from server:\n${text}`);
            }


            if (res.ok) {
                if (endpoint === 'token-balances') {
                    try {
                        const parsed = data.result;
                        setTokenData(parsed.tokenAccounts || []);
                        setOutput({
                            type: 'success',
                            content: `Native Balance: ${parsed.nativeBalance} SOL\n\nToken Accounts:\n${parsed.tokenAccounts.map((t: { symbol: any; amount: any }) => `- ${t.symbol || 'N/A'}: ${t.amount}`).join('\n')}`,
                        });
                    } catch (e) {
                        setTokenData([]);
                        setOutput({ type: 'error', content: 'Failed to parse token data.' });
                    }
                } else if (endpoint === 'transactions') {
                    const txs = data.result;
                    setOutput({ type: 'success', content: JSON.stringify(txs, null, 2) });
                    const programCountMap: Record<string, number> = {};
                    txs.forEach((tx: any) => {
                        tx.instructions.forEach((ix: any) => {
                            const program = ix.program || 'unknown';
                            programCountMap[program] = (programCountMap[program] || 0) + 1;
                        });
                    });
                    const chartData = Object.entries(programCountMap).map(([name, value]) => ({ name, value }));
                    setTxChartData(chartData);
                    setTokenData([]);
                } else if (endpoint === 'trace') {
                    setOutput({ type: 'success', content: `🔍 Traced ${data.result.length} transactions.` });
                    setTraceData(data.result);
                    setTokenData([]);
                } else if (endpoint === 'binance-detection') {
                    const { receivedFromBinance, sentToBinance, totalInteractions } = data.result;

                    let summary = `🏦 Binance Wallet Detection\n\n🔁 Total Interactions: ${totalInteractions}\n\n`;

                    if (receivedFromBinance.length > 0) {
                        summary += `📥 Received From Binance:\n`;
                        receivedFromBinance.forEach((tx: any) => {
                            summary += `→ ${tx.source} → ${tx.destination}\n   🧾 ${tx.txSig}\n   🕓 ${tx.time}\n\n`;
                        });
                    }

                    if (sentToBinance.length > 0) {
                        summary += `📤 Sent To Binance:\n`;
                        sentToBinance.forEach((tx: any) => {
                            summary += `→ ${tx.source} → ${tx.destination}\n   🧾 ${tx.txSig}\n   🕓 ${tx.time}\n\n`;
                        });
                    }

                    if (totalInteractions === 0) {
                        summary += `🤷 No interactions with Binance wallets detected.`;
                    }
                    setBinanceChartData([
                        { name: 'Received from Binance', value: receivedFromBinance.length },
                        { name: 'Sent to Binance', value: sentToBinance.length }
                    ]);


                    setOutput({ type: 'success', content: summary });
                    setTokenData([]);
                } else {
                    setOutput({ type: 'success', content: JSON.stringify(data.result, null, 2) });
                }
            } else {
                setOutput({ type: 'error', content: `Error: ${data.error}` });
            }
        } catch (err: any) {
            setOutput({ type: 'error', content: `Network Error: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };


    const copyToClipboard = () => {
        if (output?.content) {
            navigator.clipboard.writeText(output.content);
            toast.success('Copied to clipboard!');
        }
    };

    const openInExplorer = () => {
        if (address) {
            window.open(`https://solscan.io/account/${address}`, '_blank');
        }
    };


    const generateFullReport = async () => {
        if (!address) return;

        setLoading(true);
        setOutput({ type: 'success', content: 'Generating full report...' });

        const endpoints = [
            'token-balances',
            'detect-memecoins',
            'transactions',
            'trace',
            'binance-detection',
        ];

        const params = new URLSearchParams({ address });
        params.append('numTx', numTx);
        params.append('depth', '3');

        let report = `🧾 Solana Wallet Summary Report\n📍 Wallet: ${address}\n🕒 Date: ${new Date().toLocaleString()}\n\n`;

        try {
            for (const endpoint of endpoints) {
                const res = await fetch(`/api/${endpoint}?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    report += `❌ ${endpoint}: ${data.error}\n\n`;
                    continue;
                }

                const result = data.result;

                // 💰 Token Balances
                if (endpoint === 'token-balances') {
                    report += `📦 TOKEN BALANCES\nSOL Balance: ${result.nativeBalance} SOL\n`;
                    result.tokenAccounts?.forEach((token: any) => {
                        report += `- ${token.symbol || 'N/A'}: ${token.amount}\n`;
                    });
                    report += `\n`;
                }

                // 🐸 Memecoins
                else if (endpoint === 'detect-memecoins') {
                    const lines = result.split('\n').filter(Boolean);
                    const memecoins = lines.filter((line: string | string[]) => line.includes('🚀'));
                    report += `🐸 MEMECOIN SCAN\nFound ${memecoins.length} memecoin(s)\n`;
                    memecoins.forEach((_line: any, i: number) => {
                        report += `- ${lines[i + 1]?.split(':')[1]?.trim() || 'Unknown Token'}\n`;
                    });
                    report += `\n`;
                }

                // 📜 Transactions
                else if (endpoint === 'transactions') {
                    report += `📜 TRANSACTION SUMMARY\nTotal Scanned: ${result.length}\n`;
                    const programMap: Record<string, number> = {};
                    result.forEach((tx: any) => {
                        tx.instructions.forEach((ix: any) => {
                            const program = ix.program || 'unknown';
                            programMap[program] = (programMap[program] || 0) + 1;
                        });
                    });
                    Object.entries(programMap).forEach(([prog, count]) => {
                        report += `- ${prog}: ${count} txs\n`;
                    });
                    report += `\n`;
                }

                // 🔍 Trace Flow
                else if (endpoint === 'trace') {
                    report += `🔍 TRACE FLOW\n`;
                    result.slice(0, 5).forEach((tx: any) => {
                        report += `- ${tx.from.slice(0, 6)} → ${tx.to.slice(0, 6)} | ${tx.token}: ${tx.amount}\n`;
                    });
                    report += result.length > 5 ? `...and ${result.length - 5} more\n\n` : `\n`;
                }

                // 🏦 Binance Detection
                else if (endpoint === 'binance-detection') {
                    report += `🏦 BINANCE INTERACTIONS\n`;
                    report += `Total: ${result.totalInteractions}\n`;
                    report += `Received: ${result.receivedFromBinance.length}\n`;
                    report += `Sent: ${result.sentToBinance.length}\n\n`;
                }
            }

            // 🖨 Export to PDF
            const doc = new jsPDF();
            const lines = report.split('\n');
            let y = 10;
            lines.forEach((line) => {
                if (y > 280) {
                    doc.addPage();
                    y = 10;
                }
                doc.text(line, 10, y);
                y += 7;
            });

            doc.save(`solana-wallet-report-${Date.now()}.pdf`);
            setOutput({ type: 'success', content: '📄 Full report exported successfully!' });

        } catch (err: any) {
            console.error('[REPORT_ERROR]', err);
            setOutput({ type: 'error', content: `Failed to generate report: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="bg-slate-900 p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-purple-400">🪐</span>
                            Solana Wallet Inspector
                        </h1>
                        <button onClick={openInExplorer} disabled={!address} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm disabled:opacity-50">
                            <FiExternalLink size={14} />
                            View on Solscan
                        </button>
                    </div>
                    <p className="text-slate-400 mt-1">Analyze tokens, memecoins, and transactions</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-slate-500" />
                        </div>
                        <input
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter Solana wallet address..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm text-slate-400 mb-1">Transactions to fetch</label>
                            <input
                                type="number"
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"
                                value={numTx}
                                onChange={(e) => setNumTx(e.target.value)}
                                min="1"
                                max="100"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b border-slate-700 flex overflow-x-auto">
                    <button onClick={() => setActiveTab('balances')} className={`px-6 py-3 font-medium ${activeTab === 'balances' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>
                        <FiDollarSign className="inline mr-2" /> Token Balances
                    </button>
                    <button onClick={() => setActiveTab('memecoins')} className={`px-6 py-3 font-medium ${activeTab === 'memecoins' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>
                        🐸 Memecoins
                    </button>
                    <button onClick={() => setActiveTab('transactions')} className={`px-6 py-3 font-medium ${activeTab === 'transactions' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>
                        📜 Transactions
                    </button>
                    <button onClick={() => setActiveTab('trace')} className={`px-6 py-3 font-medium ${activeTab === 'trace' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>
                        <FiShare2 className="inline mr-2" /> Trace Flow
                    </button>
                    <button onClick={() => setActiveTab('binance')} className={`px-6 py-3 font-medium ${activeTab === 'binance' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>
                        🏦 Binance Transfers
                    </button>
                </div>

                <div className="p-6 flex flex-wrap gap-3">
                    <Button variant="primary" onClick={() => callEndpoint('token-balances')} disabled={loading || !address} isLoading={loading && activeTab === 'balances'} className="min-w-[180px] flex-1">
                        <FiDollarSign /> Scan Balances
                    </Button>
                    <Button variant="primary" onClick={() => callEndpoint('detect-memecoins')} disabled={loading || !address} isLoading={loading && activeTab === 'memecoins'} className="min-w-[180px] flex-1">
                        🐸 Find Memecoins
                    </Button>
                    <Button variant="secondary" onClick={() => callEndpoint('transactions')} disabled={loading || !address} isLoading={loading && activeTab === 'transactions'} className="min-w-[180px] flex-1">
                        <FiList /> View Transactions
                    </Button>
                    <Button variant="secondary" onClick={() => callEndpoint('trace')} disabled={loading || !address} isLoading={loading && activeTab === 'trace'} className="min-w-[180px] flex-1">
                        <FiShare2 /> Trace Flow
                    </Button>
                    <Button variant="secondary" onClick={() => callEndpoint('binance-detection')} disabled={loading || !address} isLoading={loading && activeTab === 'binance'} className="min-w-[180px] flex-1">
                        🏦 Detect Binance
                    </Button>
                </div>
                {activeTab === 'transactions' && txChartData.length > 0 && (
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Transaction Programs Summary</h3>
                        <div className="flex items-center justify-end mb-2">
                            <label className="text-sm text-slate-400 mr-2">Chart Type:</label>
                            <select value={chartType} onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-sm">
                                <option value="pie">Pie</option>
                                <option value="bar">Bar</option>
                            </select>
                        </div>
                        {chartType === 'pie' ? <PieChart data={txChartData} /> : <BarChart data={txChartData} />}
                    </div>
                )}

                {activeTab === 'balances' && tokenData.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Token Distribution</h3>
                        <div className="flex items-center justify-end mb-2">
                            <label className="text-sm text-slate-400 mr-2">Chart Type:</label>
                            <select value={chartType} onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-sm">
                                <option value="pie">Pie</option>
                                <option value="bar">Bar</option>
                            </select>
                        </div>
                        {chartType === 'pie' ? <PieChart data={tokenData.map(({ mint, amount, symbol }) => ({ name: symbol || mint.slice(0, 6), value: amount }))} /> : <BarChart data={tokenData.map(({ mint, amount, symbol }) => ({ name: symbol || mint.slice(0, 6), value: amount }))} />}
                        <TokenTable data={tokenData} />
                    </div>
                )}

                {activeTab === 'binance' && binanceChartData.length > 0 && (
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Binance Activity Summary</h3>
                        <div className="flex items-center justify-end mb-2">
                            <label className="text-sm text-slate-400 mr-2">Chart Type:</label>
                            <select value={chartType} onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-sm">
                                <option value="pie">Pie</option>
                                <option value="bar">Bar</option>
                            </select>
                        </div>
                        {chartType === 'pie' ? <PieChart data={binanceChartData} /> : <BarChart data={binanceChartData} />}
                    </div>
                )}

                {activeTab === 'trace' && traceData.length > 0 && (
                    <TraceTable data={traceData} />
                )}



                <div className="p-6 bg-slate-900 border-t border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-medium">
                            {activeTab === 'balances' && 'Token Balances'}
                            {activeTab === 'memecoins' && 'Memecoin Detection'}
                            {activeTab === 'transactions' && 'Transaction History'}
                            {activeTab === 'trace' && 'Flow Trace Results'}
                        </h2>
                        {output?.content && (
                            <button onClick={copyToClipboard} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
                                <FiCopy size={14} /> Copy
                            </button>
                        )}
                    </div>
                    <div className={`p-4 rounded-lg font-mono text-sm ${output?.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-slate-800 text-slate-300'} overflow-auto max-h-96`}>
                        {output ? (
                            <pre className="whitespace-pre-wrap break-words">{output.content}</pre>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                {!address ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FiAlertCircle /> Enter a wallet address to begin
                                    </div>
                                ) : (
                                    'Results will appear here...'
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 justify-end px-6 pb-6">
                    <Button variant="ghost" onClick={exportToCSV} disabled={!output}>📄 Export CSV</Button>
                    <Button variant="ghost" onClick={exportToPDF} disabled={!output}>🖨 Export PDF</Button>
                    <Button variant="ghost" onClick={generateFullReport} disabled={!address}>🧾 Export Full Report</Button>

                </div>
            </div>
        </div>
    );
}
