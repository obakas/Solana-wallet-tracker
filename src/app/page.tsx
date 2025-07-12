import SolanaToolUI from '@/components/SolanaToolUI';
import { Toaster } from 'react-hot-toast'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <SolanaToolUI />
      <Toaster />
    </main>
  );
}
