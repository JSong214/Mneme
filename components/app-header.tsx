import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b border-line/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/projects" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-teal-500 text-white">
            <BrainCircuit aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <span className="text-sm font-semibold tracking-normal text-ink">
            Mneme
          </span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-1 text-sm">
          <Link
            href="/projects"
            className="rounded-lg px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            首页
          </Link>
        </nav>
      </div>
    </header>
  );
}
