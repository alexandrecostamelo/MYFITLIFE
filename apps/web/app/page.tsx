import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-primary">MyFitLife</h1>
          <p className="mb-8 text-lg text-muted-foreground">Seu sistema operacional de saúde</p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg"><Link href="/login">Entrar</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/login">Criar conta</Link></Button>
          </div>
        </div>
      </main>
      <footer className="border-t bg-white py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-md space-x-4 px-4">
          <Link href="/termos" className="hover:text-foreground">Termos</Link>
          <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
          <span>© {new Date().getFullYear()} MyFitLife</span>
        </div>
      </footer>
    </div>
  );
}
