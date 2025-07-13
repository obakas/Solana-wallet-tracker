import { detectGhostTokenAwakenings } from '@/lib/solanaFunctions';
import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';


const RPC_ENDPOINT = process.env.NEXT_PUBLIC_QUIKNODE_RPC!;
export const solanaConnection = new Connection(RPC_ENDPOINT);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Missing address param' }, { status: 400 });
  }

  try {
    const awakenings = await detectGhostTokenAwakenings(address, solanaConnection);
    return NextResponse.json({ result: awakenings });
  } catch (err: any) {
    console.error('[GHOST_FETCH_ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
