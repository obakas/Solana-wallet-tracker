import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/solanaFunctions';

export async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get('address');
    const numTx = parseInt(req.nextUrl.searchParams.get('numTx') || '5', 10);

    if (!address) {
        return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
    }

    try {
        const data = await getTransactions(address, numTx);
        return NextResponse.json({ result: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
