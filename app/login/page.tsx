import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { login, signup } from '@/app/auth/actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label, Input } from '@/components/ui/field';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">ClinicOS AI</h1>
          <p className="mt-1 text-sm text-muted">Entre com seu email e senha.</p>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {message && <Alert tone="success">{message}</Alert>}

        <Card>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            <div className="flex gap-2">
              <Button formAction={login} variant="primary" className="flex-1">
                Entrar
              </Button>
              <Button formAction={signup} variant="secondary" className="flex-1">
                Criar conta
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
