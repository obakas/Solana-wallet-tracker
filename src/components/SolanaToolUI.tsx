"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { FiCopy, FiExternalLink, FiSearch, FiDollarSign, FiAlertCircle, FiList, FiShare2, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { SiSolana } from 'react-icons/si';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import PieChart from './PieChart';
import BarChart from './BarChart';
import TokenTable from './TokenTable';
import TraceTable from './TraceTable';
import { GhostTokenTable } from './GhostTokenTable';
import ClusterGraph from './ClusterGraph';

export default function SolanaToolUI() {
    const [address, setAddress] = useState('');
    const [numTx, setNumTx] = useState('10');
    const [output, setOutput] = useState<{ type: 'success' | 'error'; content: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'balances' | 'memecoins' | 'transactions' | 'trace' | 'binance' | 'ghost'| 'cluster-wallets' | 'cluster'>('balances');
    const [tokenData, setTokenData] = useState<any[]>([]);
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
    const [txChartData, setTxChartData] = useState<{ name: string; value: number }[]>([]);
    const [binanceChartData, setBinanceChartData] = useState<{ name: string; value: number }[]>([]);
    const [traceData, setTraceData] = useState<any[]>([]);
    const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [ghostData, setGhostData] = useState<any[]>([]);
    const [clusterData, setClusterData] = useState<any>(null);


    useEffect(() => {
        if (activeTab === 'ghost' && address) {
            (async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/ghost-tokens?address=${address}`);
                    const json = await res.json();
                    if (res.ok) {
                        setGhostData(json.result || []);
                        setOutput({ type: 'success', content: `Found ${json.result.length} ghost tokens.` });
                    } else {
                        throw new Error(json.error || 'Unknown error');
                    }
                } catch (err: any) {
                    setOutput({ type: 'error', content: `Ghost token fetch failed: ${err.message}` });
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [activeTab, address]);


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const storedAddresses = localStorage.getItem('recentSolanaAddresses');
        if (storedAddresses) {
            setRecentAddresses(JSON.parse(storedAddresses));
        }
    }, []);

    const saveRecentAddress = (addr: string) => {
        if (!addr) return;

        const updated = [addr, ...recentAddresses.filter(a => a !== addr)].slice(0, 5);
        setRecentAddresses(updated);
        localStorage.setItem('recentSolanaAddresses', JSON.stringify(updated));
    };

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
        const leftMargin = 10;
        const rightMargin = 10;
        const pageWidth = doc.internal.pageSize.getWidth(); // Get A4 page width (210mm for A4)
        const maxWidth = pageWidth - leftMargin - rightMargin; // Usable width (190mm)
        const lines = output.content.split('\n');
        let y = 10;

        lines.forEach((line) => {
            // Split long lines into chunks that fit within maxWidth
            const wrappedLines = doc.splitTextToSize(line, maxWidth);

            wrappedLines.forEach((wrappedLine: string | string[]) => {
                if (y > 280) {
                    doc.addPage();
                    y = 10;
                }
                doc.text(wrappedLine, leftMargin, y);
                y += 7;
            });
        });

        doc.save(`solana-report-${activeTab}.pdf`);
    };

    const callEndpoint = async (endpoint: string) => {
        setLoading(true);
        setOutput({ type: 'success', content: 'Loading...' });
        saveRecentAddress(address);

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
                } else if (endpoint === 'cluster-wallets') {
                    setOutput({ type: 'success', content: JSON.stringify(data.result, null, 2) });
                    // Optionally set state like setClusterData(data.result)
                } else if (endpoint === 'cluster') {
                    setOutput({ type: 'success', content: `🧠 Clustered ${data.result.nodes.length} wallets.` });
                    setClusterData(data.result);
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
        saveRecentAddress(address);

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

        // Replaced emojis with plain text for PDF compatibility
        let report = `Report: Solana Wallet Summary Report\nWallet: ${address}\nDate: ${new Date().toLocaleString()}\n\n`;

        try {
            for (const endpoint of endpoints) {
                const res = await fetch(`/api/${endpoint}?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    report += `Error ${endpoint}: ${data.error}\n\n`;
                    continue;
                }

                const result = data.result;

                // Token Balances
                if (endpoint === 'token-balances') {
                    report += `TOKEN BALANCES\nSOL Balance: ${result.nativeBalance} SOL\n`;
                    result.tokenAccounts.forEach((token: any) => {
                        report += `- ${token.symbol || 'N/A'}: ${token.amount}\n`;
                    });
                    report += `\n`;
                }

                // Memecoins
                else if (endpoint === 'detect-memecoins') {
                    const lines = result.split('\n').filter(Boolean);
                    const memecoins = lines.filter((line: string | string[]) => line.includes('Memecoin')); // Replaced 🚀 with text
                    report += `MEMECOIN SCAN\nFound ${memecoins.length} memecoin(s)\n`;
                    memecoins.forEach((_line: any, i: number) => {
                        report += `- ${lines[i + 1]?.split(':')[1]?.trim() || 'Unknown Token'}\n`;
                    });
                    report += `\n`;
                }

                // Transactions
                else if (endpoint === 'transactions') {
                    report += `TRANSACTION SUMMARY\nTotal Scanned: ${result.length}\n`;
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

                // Trace Flow
                else if (endpoint === 'trace') {
                    report += `TRACE FLOW\n`;
                    result.slice(0, 5).forEach((tx: any) => {
                        report += `- ${tx.from.slice(0, 6)} → ${tx.to.slice(0, 6)} | ${tx.token}: ${tx.amount}\n`;
                    });
                    report += result.length > 5 ? `...and ${result.length - 5} more\n\n` : `\n`;
                }

                // Binance Detection
                else if (endpoint === 'binance-detection') {
                    report += `BINANCE INTERACTIONS\n`;
                    report += `Total: ${result.totalInteractions}\n`;
                    report += `Received: ${result.receivedFromBinance.length}\n`;
                    report += `Sent: ${result.sentToBinance.length}\n\n`;
                }
            }

            // 🖨 Export to PDF
            const doc = new jsPDF();
            const leftMargin = 8;
            const rightMargin = 8;
            const pageWidth = doc.internal.pageSize.getWidth(); // Get A4 page width (210mm)
            const maxWidth = pageWidth - leftMargin - rightMargin; // Usable width (194mm)
            const lines = report.split('\n');
            let y = 8; // Start at 8mm from top to match margins

            lines.forEach((line) => {
                const wrappedLines = doc.splitTextToSize(line, maxWidth);
                wrappedLines.forEach((wrappedLine: string | string[]) => {
                    if (y > 280) {
                        doc.addPage();
                        y = 8;
                    }
                    doc.text(wrappedLine, leftMargin, y);
                    y += 7;
                });
            });

            doc.save(`solana-wallet-report-${Date.now()}.pdf`);
            setOutput({ type: 'success', content: 'Report: Full report exported successfully!' });

        } catch (err: any) {
            console.error('[REPORT_ERROR]', err);
            setOutput({ type: 'error', content: `Failed to generate report: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSelect = (addr: string) => {
        setAddress(addr);
        toast.success(`Address ${addr.slice(0, 6)}...${addr.slice(-4)} loaded`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header with Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-800/50 flex items-center">
                        <div className="bg-purple-600/20 p-3 rounded-lg mr-3">
                            <SiSolana className="text-purple-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-200">Solana Network</p>
                            <p className="font-bold">Mainnet Beta</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 rounded-xl p-4 border border-blue-800/50 flex items-center">
                        <div className="bg-blue-600/20 p-3 rounded-lg mr-3">
                            <FiDollarSign className="text-blue-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-200">Token Balances</p>
                            <p className="font-bold">Multi-chain</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-900/50 to-green-800/30 rounded-xl p-4 border border-green-800/50 flex items-center">
                        <div className="bg-green-600/20 p-3 rounded-lg mr-3">
                            <FiShare2 className="text-green-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-green-200">Transaction Flow</p>
                            <p className="font-bold">3-level Trace</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 rounded-xl p-4 border border-yellow-800/50 flex items-center">
                        <div className="bg-yellow-600/20 p-3 rounded-lg mr-3">
                            <FiList className="text-yellow-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-yellow-200">Recent Addresses</p>
                            <p className="font-bold">{recentAddresses.length} Saved</p>
                        </div>
                    </div>
                </div>
                {/* Main Card */}
                <div className="bg-slate-800/80 rounded-xl shadow-2xl overflow-hidden border border-slate-700/50 backdrop-blur-sm">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-700/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                    <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                                        Solana Wallet Inspector
                                    </span>
                                </h1>
                                <p className="text-slate-400 mt-1">Comprehensive analysis tool for Solana wallets and transactions</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={openInExplorer}
                                    disabled={!address}
                                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-all duration-200"
                                >
                                    <FiExternalLink size={16} />
                                    {isMobile ? 'Explorer' : 'View on Solscan'}
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                                >
                                    <FiRefreshCw size={16} />
                                    {isMobile ? 'Reset' : 'Reset Tool'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Address Input Section */}
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="text-slate-500" />
                            </div>
                            <input
                                className="w-full bg-slate-700/70 border border-slate-600/50 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter Solana wallet address (e.g., 5FHwkrdx...)"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        {/* Recent Addresses */}
                        {recentAddresses.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recentAddresses.map((addr) => (
                                    <button
                                        key={addr}
                                        onClick={() => handleAddressSelect(addr)}
                                        className="text-xs bg-slate-700/50 hover:bg-slate-700 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                                    >
                                        <span>{addr.slice(0, 6)}...{addr.slice(-4)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm text-slate-400 mb-1">Transactions to fetch (1-100)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-slate-700/70 border border-slate-600/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        value={numTx}
                                        onChange={(e) => setNumTx(e.target.value)}
                                        min="1"
                                        max="100"
                                    />
                                    <div className="absolute right-3 top-3 text-slate-400 text-sm">txs</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-700/50 flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('balances')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'balances' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <FiDollarSign /> {isMobile ? 'Balances' : 'Token Balances'}
                        </button>
                        <button
                            onClick={() => setActiveTab('memecoins')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'memecoins' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="text-yellow-400">🐸</span> {isMobile ? 'Memes' : 'Memecoins'}
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'transactions' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <FiList /> {isMobile ? 'TXs' : 'Transactions'}
                        </button>
                        <button
                            onClick={() => setActiveTab('trace')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'trace' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <FiShare2 /> {isMobile ? 'Trace' : 'Trace Flow'}
                        </button>
                        <button
                            onClick={() => setActiveTab('binance')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'binance' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="text-blue-400">🏦</span> {isMobile ? 'Binance' : 'Binance Transfers'}
                        </button>
                        <button
                            onClick={() => setActiveTab('ghost')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'ghost' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="text-blue-400">👻</span>  {isMobile ? 'Ghost' : 'Ghost Tokens'}
                        </button>
                        <button
                            onClick={() => setActiveTab('cluster-wallets')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'cluster-wallets' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="text-blue-400">🤖</span>  {isMobile ? 'cluster wx' : 'Cluster Wallets'}
                        </button>
                        <button
                            onClick={() => setActiveTab('cluster')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'cluster' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="text-blue-400">🧠</span>{isMobile ? 'Cluster' : 'Smart Clustering'}
                        </button>

                    </div>


                    {/* Action Buttons */}
                    <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Button
                            variant="primary"
                            onClick={() => callEndpoint('token-balances')}
                            disabled={loading || !address}
                            isLoading={loading && activeTab === 'balances'}
                            className="flex-1 min-w-full"
                        >
                            <FiDollarSign /> {isMobile ? 'Balances' : 'Scan Balances'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => callEndpoint('detect-memecoins')}
                            disabled={loading || !address}
                            isLoading={loading && activeTab === 'memecoins'}
                            className="flex-1 min-w-full"
                        >
                            <span className="text-yellow-400">🐸</span> {isMobile ? 'Memes' : 'Find Memecoins'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => callEndpoint('transactions')}
                            disabled={loading || !address}
                            isLoading={loading && activeTab === 'transactions'}
                            className="flex-1 min-w-full"
                        >
                            <FiList /> {isMobile ? 'TXs' : 'View Transactions'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => callEndpoint('trace')}
                            disabled={loading || !address}
                            isLoading={loading && activeTab === 'trace'}
                            className="flex-1 min-w-full"
                        >
                            <FiShare2 /> {isMobile ? 'Trace' : 'Trace Flow'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => callEndpoint('binance-detection')}
                            disabled={loading || !address}
                            isLoading={loading && activeTab === 'binance'}
                            className="flex-1 min-w-full"
                        >
                            <span className="text-blue-400">🏦</span> {isMobile ? 'Binance' : 'Detect Binance Tx'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => callEndpoint('cluster-wallets')}
                            disabled={loading || !address}
                            isLoading={loading && activeTab === 'cluster'}
                            className="flex-1 min-w-full"
                        >
                            <span className="text-blue-400">🤖</span> {isMobile ? 'Clusters' : 'Cluster Wallets'}

                        </Button>

                    </div>

                    {/* Data Visualization Section */}
                    {activeTab === 'transactions' && txChartData.length > 0 && (
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/30">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                                <h3 className="text-lg font-semibold">Transaction Programs Summary</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-400">Chart Type:</label>
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')}
                                        className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="pie">Pie Chart</option>
                                        <option value="bar">Bar Chart</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                                {chartType === 'pie' ?
                                    <PieChart data={txChartData} /> :
                                    <BarChart data={txChartData} />
                                }
                            </div>
                        </div>
                    )}

                    {activeTab === 'balances' && tokenData.length > 0 && (
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/30">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                                <h3 className="text-lg font-semibold">Token Distribution</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-400">Chart Type:</label>
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')}
                                        className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="pie">Pie Chart</option>
                                        <option value="bar">Bar Chart</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 mb-6">
                                {chartType === 'pie' ? (
                                    <PieChart data={tokenData.map(({ mint, amount, symbol }) => ({ name: symbol || mint.slice(0, 6), value: amount }))} />
                                ) : (
                                    <BarChart data={tokenData.map(({ mint, amount, symbol }) => ({ name: symbol || mint.slice(0, 6), value: amount }))} />
                                )}
                            </div>
                            <TokenTable data={tokenData} />
                        </div>
                    )}

                    {activeTab === 'binance' && binanceChartData.length > 0 && (
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/30">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                                <h3 className="text-lg font-semibold">Binance Activity Summary</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-400">Chart Type:</label>
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')}
                                        className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="pie">Pie Chart</option>
                                        <option value="bar">Bar Chart</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                                {chartType === 'pie' ?
                                    <PieChart data={binanceChartData} /> :
                                    <BarChart data={binanceChartData} />
                                }
                            </div>
                        </div>
                    )}

                    {activeTab === 'trace' && traceData.length > 0 && (
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/30">
                            <h3 className="text-lg font-semibold mb-4">Transaction Flow Trace</h3>
                            <TraceTable data={traceData} />
                        </div>
                    )}

                    {activeTab === 'ghost' && (
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/30">
                            <h3 className="text-lg font-semibold mb-4">Ghost Token Awakening Detection</h3>
                            <GhostTokenTable data={ghostData} />
                        </div>
                    )}

                    {activeTab === 'cluster' && clusterData && (
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/30">
                            <h3 className="text-lg font-semibold mb-4">Wallet Clustering Graph</h3>
                            <ClusterGraph data={clusterData} />
                        </div>
                    )}


                    {/* Results Section */}
                    <div className="p-6 bg-slate-900/50 border-t border-slate-700/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                            <h2 className="font-medium text-lg">
                                {activeTab === 'balances' && 'Token Balances'}
                                {activeTab === 'memecoins' && 'Memecoin Detection'}
                                {activeTab === 'transactions' && 'Transaction History'}
                                {activeTab === 'trace' && 'Flow Trace Results'}
                                {activeTab === 'binance' && 'Binance Interactions'}
                                {activeTab === 'cluster' && 'Cluster Wallets Detection'}
                            </h2>
                            {output?.content && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-slate-400 hover:text-white flex items-center gap-1 text-sm bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1 rounded-lg transition-colors"
                                    >
                                        <FiCopy size={14} /> Copy
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={`p-4 rounded-lg font-mono text-sm ${output?.type === 'error' ? 'bg-red-900/20 text-red-200 border border-red-800/50' : 'bg-slate-800/30 text-slate-300 border border-slate-700/30'} overflow-auto max-h-96 transition-all duration-200`}>
                            {output ? (
                                <pre className="whitespace-pre-wrap break-words">{output.content}</pre>
                            ) : (
                                <div className="text-center py-8 text-slate-500 flex flex-col items-center justify-center">
                                    {!address ? (
                                        <>
                                            <FiAlertCircle className="text-2xl mb-2" />
                                            <p>Enter a Solana wallet address to begin analysis</p>
                                            {recentAddresses.length > 0 && (
                                                <p className="text-sm mt-2">Or select from recent addresses above</p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="animate-pulse flex flex-col items-center">
                                                <SiSolana className="text-3xl text-purple-400 mb-2" />
                                                <p>Ready to analyze wallet</p>
                                                <p className="text-xs mt-1 text-purple-300">{address.slice(0, 12)}...{address.slice(-4)}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="p-6 bg-slate-900/30 border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                            <Button
                                variant="ghost"
                                onClick={exportToCSV}
                                disabled={!output}
                                className="flex items-center gap-2"
                            >
                                <FiDownload /> CSV
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={exportToPDF}
                                disabled={!output}
                                className="flex items-center gap-2"
                            >
                                <FiDownload /> PDF
                            </Button>
                            <Button
                                variant="primary"
                                onClick={generateFullReport}
                                disabled={!address}
                                className="flex items-center gap-2"
                            >
                                <FiDownload /> Full Report
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-slate-500 text-sm">
                    <p>Solana Wallet Inspector • Not affiliated with Solana Labs</p>
                    <p className="mt-1">Data is read-only and never stored</p>
                </div>
            </div>
        </div>
    );
}
