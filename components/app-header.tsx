import Link from "next/link";
import { BrainCircuit } from "lucide-react";

/**
 * 顶部导航栏组件
 * 采用极简的半透明磨砂玻璃设计，去掉刺眼的亮色，统一使用纯黑（ink）色块作为 Logo 背景。
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.05] bg-white/70 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/projects" className="group flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-white transition-transform duration-500 ease-smooth group-hover:rotate-12">
            <BrainCircuit aria-hidden="true" size={18} strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Mneme
          </span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-1 text-sm">
          <Link
            href="/projects"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 transition-all duration-300 ease-smooth hover:bg-black/[0.04] hover:text-ink focus:outline-none focus:ring-1 focus:ring-black/20"
          >
            首页
          </Link>
        </nav>
      </div>
    </header>
  );
}
