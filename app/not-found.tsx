import Link from "next/link";
import { AppHeader } from "@/components/app-header";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Not found
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-normal text-ink">
            This workspace is not available.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            The project may have been removed, or the URL may be incorrect.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex h-10 w-fit items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Back to projects
        </Link>
      </section>
    </main>
  );
}
