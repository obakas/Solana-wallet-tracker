import { NextResponse } from 'next/server';
import { detectMemecoins } from '@/lib/solanaFunctions';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
    }

    try {
        const result = await detectMemecoins(address);
        return NextResponse.json({ result });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
