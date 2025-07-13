import { NextRequest, NextResponse } from 'next/server';
import { traceTokenTransfers } from '@/lib/solanaFunctions';

// Add a tiny sleep helper
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get('address');
    const depthParam = req.nextUrl.searchParams.get('depth');
    const depth = parseInt(depthParam || '2', 10); // Default to 2 levels deep

    if (!address) {
        return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
    }

    try {
        let result;
        let retries = 0;

        while (retries < 5) {
            try {
                result = await traceTokenTransfers(address, depth);
                break; // success
            } catch (err: any) {
                const message = err.message || '';
                const isRateLimited = message.includes('15/second');

                if (isRateLimited) {
                    console.warn(`[RATE_LIMIT] Waiting to retry... attempt ${retries + 1}`);
                    await sleep(1200); // wait 1.2s before retrying
                    retries++;
                } else {
                    throw err; // real error, break the loop
                }
            }
        }

        if (!result) {
            return NextResponse.json({ error: 'Rate limit exceeded too many times.' }, { status: 429 });
        }

        return NextResponse.json({ result });

    } catch (err: any) {
        console.error('[TRACE_ERROR]', err);
        return NextResponse.json({ error: err.message || 'Trace failed' }, { status: 500 });
    }
}
