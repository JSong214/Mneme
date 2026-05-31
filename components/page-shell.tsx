import { AppHeader } from "@/components/app-header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        {children}
      </div>
    </main>
  );
}
