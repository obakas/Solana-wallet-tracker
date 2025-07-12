import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';


if (!process.env.NEXT_PUBLIC_SOLANA_RPC) {
  throw new Error('Missing NEXT_PUBLIC_SOLANA_RPC in environment variables');
}


const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC!;
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
        ? '\nNo memecoins found in this wallet.'
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
