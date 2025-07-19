import { Connection, PublicKey, ParsedConfirmedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BINANCE_WALLETS } from './binanceWallets';


// if (!process.env.NEXT_PUBLIC_QUIKNODE_RPC) {
//     throw new Error('Missing NEXT_PUBLIC_QUIKNODE_RPC in environment variables');
// }


const RPC_ENDPOINT = process.env.NEXT_PUBLIC_ALCHEMY_M_API!;
export const solanaConnection = new Connection(RPC_ENDPOINT);


const MEMECOIN_KEYWORDS = [
    'bonk', 'wif', 'pepe', 'dog', 'frog', 'shiba', 'floki', 'silly', 'toshi', 'popcat',
    'meme', 'doge', 'kitty', 'monke', 'woof', 'based', 'troll', 'lol', 'gm', 'wen'
];

export async function getTokenBalances(address: string) {
    const pubKey = new PublicKey(address);
    const solBalance = await solanaConnection.getBalance(pubKey);

    const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID
    });

    const splTokens = tokenAccounts.value.map((account) => {
        const info = account.account.data.parsed.info;
        return {
            name: info.tokenAmount.name,
            mint: info.mint,
            amount: info.tokenAmount.uiAmount,
            symbol: info.tokenAmount.symbol || '',
            decimals: info.tokenAmount.decimals
        };
    });

    return {
        nativeBalance: solBalance / 1e9,
        tokenAccounts: splTokens
    };
}


export async function detectMemecoins(address: string) {
    const pubKey = new PublicKey(address);
    const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID,
    });

    let output = `Scanning for memecoins in wallet: ${address}`;
    let memecoinCount = 0;

    for (const account of tokenAccounts.value) {
        const parsed = account.account.data.parsed.info;
        const mint = parsed.mint;
        const amount = parsed.tokenAmount.uiAmount;
        const symbol = parsed.tokenAmount.symbol?.toLowerCase?.() || '';
        const name = parsed.tokenAmount.name?.toLowerCase?.() || '';

        const isMemecoin = MEMECOIN_KEYWORDS.some(keyword =>
            symbol.includes(keyword) || name.includes(keyword)
        );

        if (isMemecoin) {
            memecoinCount++;
            output += `🚀 Memecoin Detected!\n- Mint Address: ${mint}\n- Symbol: ${symbol.toUpperCase()}\n- Name: ${name}\n- Amount: ${amount}\n\n`;
        }
    }

    output += memecoinCount === 0
        ? `\nNo memecoins found in this wallet.`
        : `\n✅ Found ${memecoinCount} memecoin(s).`;

    return output;
}

export async function getTransactions(address: string, numTx: number) {
    const pubKey = new PublicKey(address);
    const txList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: numTx });
    const signatures = txList.map(tx => tx.signature);
    const txDetails = await solanaConnection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
    });

    const result = txList.map((tx, i) => {
        const txDetail = txDetails[i];
        const instructions = txDetail?.transaction.message.instructions.map((ix: any) => ({
            program: ix.program,
            programId: ix.programId.toString(),
            info: ix.parsed?.info || {},
        })) || [];

        return {
            signature: tx.signature,
            date: new Date((tx.blockTime ?? 0) * 1000).toISOString(),
            status: tx.confirmationStatus,
            instructions,
        };
    });

    return result;
}



export async function traceTokenTransfers(startAddress: string, depth = 1) {
    const visited = new Set<string>();
    const traceResult: {
        id: string;
        from: string;
        to: string;
        token: string;
        amount: number;
        date: string;
    }[] = [];

    async function trace(address: string, level: number) {
        if (level > depth) return;

        const pubKey = new PublicKey(address);
        const txList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: 10 });
        const signatures = txList.map(tx => tx.signature);
        const txDetails = await solanaConnection.getParsedTransactions(signatures);

        for (let i = 0; i < txDetails.length; i++) {
            const tx = txDetails[i];
            const instructions = tx?.transaction.message.instructions || [];
            const blockTime = tx?.blockTime ?? 0;
            const date = new Date(blockTime * 1000).toISOString();
            const txSig = tx?.transaction.signatures[0];

            for (const ix of instructions) {
                if ('parsed' in ix && ix.parsed) {
                    const parsed = ix.parsed;
                    const type = parsed?.type;
                    const info = parsed?.info;

                    if (
                        type === "transfer" &&
                        info?.destination &&
                        info?.source === address
                    ) {
                        const from = info.source;
                        const to = info.destination;
                        const token = ix.programId.toBase58() === "11111111111111111111111111111111" ? "SOL" : info.mint || "UNKNOWN";
                        const amount = Number(info.amount || 0) / 10 ** (info.decimals || 9);
                        const key = `${from}->${to}->${token}->${txSig}`;

                        if (visited.has(key)) continue;
                        visited.add(key);

                        traceResult.push({
                            id: key,
                            from,
                            to,
                            token,
                            amount,
                            date
                        });

                        await trace(to, level + 1);
                    }
                }
            }
        }
    }

    await trace(startAddress, 0); // start from level 0
    return traceResult;
}





export async function detectBinanceActivity(address: string) {
    const pubKey = new PublicKey(address);
    const txs = await solanaConnection.getSignaturesForAddress(pubKey, { limit: 10 });
    const signatures = txs.map(tx => tx.signature);
    const txDetails = await solanaConnection.getParsedTransactions(signatures);

    let receivedFromBinance = [];
    let sentToBinance = [];

    for (const tx of txDetails) {
        if (!tx) continue;
        const instructions = tx.transaction.message.instructions;

        for (const ix of instructions) {
            const parsed = (ix as any).parsed?.info;
            if (!parsed) continue;

            const source = parsed.source || '';
            const destination = parsed.destination || '';

            if (BINANCE_WALLETS.includes(source)) {
                receivedFromBinance.push({
                    txSig: tx.transaction.signatures[0],
                    source,
                    destination,
                    time: new Date((tx.blockTime ?? 0) * 1000).toISOString(),
                });
            }

            if (BINANCE_WALLETS.includes(destination)) {
                sentToBinance.push({
                    txSig: tx.transaction.signatures[0],
                    source,
                    destination,
                    time: new Date((tx.blockTime ?? 0) * 1000).toISOString(),
                });
            }
        }
    }

    return {
        receivedFromBinance,
        sentToBinance,
        totalInteractions: receivedFromBinance.length + sentToBinance.length,
    };
}


const DORMANT_DAYS = 7;
const MAX_TRANSACTIONS = 1000;

export async function detectGhostTokenAwakenings(walletAddress: string, solanaConnection: Connection) {
    const walletPubkey = new PublicKey(walletAddress);
    const now = new Date();
    const ghostAwakenings: any[] = [];

    const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID,
    });

    for (const accountInfo of tokenAccounts.value) {
        const mint = accountInfo.account.data.parsed.info.mint;
        const tokenPubkey = new PublicKey(mint);

        const signatures = await solanaConnection.getSignaturesForAddress(tokenPubkey, { limit: MAX_TRANSACTIONS });
        if (signatures.length < 2) continue;

        const transactions: ParsedConfirmedTransaction[] = [];
        for (const sig of signatures) {
            const tx = await solanaConnection.getParsedTransaction(sig.signature, 'confirmed');
            if (tx) transactions.push(tx);
        }

        const sortedTx = transactions
            .filter(tx => tx?.blockTime)
            .sort((a, b) => (a.blockTime! - b.blockTime!));

        if (sortedTx.length < 2) continue;

        const secondLastTx = sortedTx[sortedTx.length - 2];
        const lastTx = sortedTx[sortedTx.length - 1];

        const lastTime = new Date((lastTx.blockTime || 0) * 1000);
        const prevTime = new Date((secondLastTx.blockTime || 0) * 1000);

        const diffDays = Math.floor((lastTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= DORMANT_DAYS) {
            const instructions = lastTx.transaction.message.instructions;
            let from = '';
            let to = '';
            let amount = '';

            for (const ix of instructions) {
                if ('parsed' in ix && ix.parsed?.type === 'transfer') {
                    from = ix.parsed.info.source;
                    to = ix.parsed.info.destination;
                    amount = ix.parsed.info.amount;
                }
            }

            ghostAwakenings.push({
                mint,
                daysDormant: diffDays,
                awakenedAt: lastTime.toISOString(),
                recentTransferAmount: amount,
                from,
                to,
            });
        }
    }

    return ghostAwakenings;
}


export async function getClusteredWallets(walletAddress: string, solanaConnection: Connection) {
    const addressSet = new Set<string>();
    addressSet.add(walletAddress);

    const walletPubkey = new PublicKey(walletAddress);
    const signatures = await solanaConnection.getSignaturesForAddress(walletPubkey, { limit: 100 });

    for (const sig of signatures) {
        const tx = await solanaConnection.getParsedTransaction(sig.signature, 'confirmed');
        if (!tx) continue;

        for (const ix of tx.transaction.message.instructions) {
            if ('parsed' in ix) {
                const info = ix.parsed.info;
                if (info.source) addressSet.add(info.source);
                if (info.destination) addressSet.add(info.destination);
            }
        }
    }

    return Array.from(addressSet);
}


export async function clusterWallets(address: string) {
    // Example dummy clusters (replace with real logic later)
    return {
        nodes: [
            { id: address, group: 1 },
            { id: 'WalletA', group: 1 },
            { id: 'WalletB', group: 2 },
        ],
        links: [
            { source: address, target: 'WalletA' },
            { source: address, target: 'WalletB' },
        ]
    };
}





