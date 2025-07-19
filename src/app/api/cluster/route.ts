import { NextRequest, NextResponse } from 'next/server';
import { clusterWallets } from '@/lib/solanaFunctions';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        const result = await clusterWallets(address);
        return NextResponse.json({ result });
    } catch (err: any) {
        console.error('[CLUSTER_ERROR]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
