import { NextRequest, NextResponse } from 'next/server';
import { detectBinanceActivity } from '@/lib/solanaFunctions';

export async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
    }

    try {
        const result = await detectBinanceActivity(address);
        return NextResponse.json({ result });
    } catch (err: any) {
        console.error('[BINANCE_ERROR]', err);
        return NextResponse.json({ error: err.message || 'Detection failed' }, { status: 500 });
    }
}
