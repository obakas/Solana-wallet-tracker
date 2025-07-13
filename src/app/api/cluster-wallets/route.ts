import { NextRequest, NextResponse } from 'next/server';
import { getClusteredWallets } from '@/lib/solanaFunctions';
import { Connection } from '@solana/web3.js';


const RPC_ENDPOINT = process.env.NEXT_PUBLIC_QUIKNODE_RPC!;
export const solanaConnection = new Connection(RPC_ENDPOINT);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
        }

        const cluster = await getClusteredWallets(address, solanaConnection);

        return NextResponse.json({ result: cluster });
    } catch (err: any) {
        console.error('[CLUSTER_ERROR]', err);
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    }
}
