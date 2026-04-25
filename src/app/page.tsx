import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  Building2,
  Compass,
  ShieldCheck,
  Sparkles,
  Truck,
  Users2,
} from "lucide-react";

import { BusinessInquiryForm } from "@/components/public/BusinessInquiryForm";
import { BrandMark } from "@/components/shell/BrandMark";
import { getHomeSnapshot, isLiveRepositoryMode } from "@/lib/repository";
import {
  formatCompactCurrency,
  getStatusLabel,
} from "@/lib/utils";

const featureCards = [
  {
    title: "Business onboarding",
    copy: "New companies start with a short inquiry. Admin reviews the request, qualifies the workflow, and then grants portal access.",
    icon: Users2,
  },
  {
    title: "Client portal",
    copy: "Approved clients can sign in, submit deliveries, review statuses, and keep their own requests organized in one place.",
    icon: Building2,
  },
  {
    title: "Operations control",
    copy: "Admins keep dispatch, drivers, payments, inventory, and route planning separated into clear workspaces.",
    icon: Compass,
  },
];

export default async function Home() {
  await connection();
  const snapshot = await getHomeSnapshot();
  const demoMode = !isLiveRepositoryMode();
  const deliveredCount = snapshot.metrics.deliveredToday;
  const activeCount = snapshot.metrics.activeDeliveries;
  const activeClients = snapshot.clientAccounts.length;

  return (
    <main className="pb-16 sm:pb-20">
      <div className="shell pt-5 sm:pt-7">
        <header className="panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`chip ${
                demoMode
                  ? "bg-amber-500/15 text-amber-200 ring-amber-400/25"
                  : "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25"
              }`}
            >
              {demoMode ? "Demo mode" : "Live mode"}
            </span>
            <Link href="/sign-in" className="button-secondary">
              Client sign in
            </Link>
            <Link href="/driver-sign-in" className="button-secondary">
              Driver sign in
            </Link>
            <Link href="/admin" className="button-secondary">
              Admin
            </Link>
          </div>
        </header>
      </div>

      <section className="shell mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel-strong overflow-hidden">
          <div className="relative z-10">
            <p className="section-label">Courier operations made simple</p>
            <h1 className="headline mt-4 max-w-3xl">
              We help businesses hand off deliveries cleanly, then keep clients
              updated without exposing the whole back office.
            </h1>
            <p className="copy mt-5 max-w-2xl">
              RouteGrid gives your team a controlled public front, a structured
              onboarding flow for new business clients, and separate workspaces
              for clients and admins so each person sees only what they need.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <p className="section-label">Active jobs</p>
                <p className="mt-3 text-3xl font-semibold text-white">{activeCount}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Moving through the network right now
                </p>
              </div>
              <div className="metric-card">
                <p className="section-label">Delivered</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {deliveredCount}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Completed in the current ledger
                </p>
              </div>
              <div className="metric-card">
                <p className="section-label">Client value</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {formatCompactCurrency(snapshot.metrics.totalRevenue)}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Managed across active client work
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#inquiry" className="button-primary">
                Become a client
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/sign-in" className="button-secondary">
                Existing clients
              </Link>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-orange-200">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">How it works</p>
              <p className="text-lg font-semibold text-white">
                Simple onboarding flow
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="metric-card">
              <p className="section-label">1. Inquiry</p>
              <p className="mt-2 text-base font-semibold text-white">
                A business sends onboarding details through the public site.
              </p>
            </div>
            <div className="metric-card">
              <p className="section-label">2. Review</p>
              <p className="mt-2 text-base font-semibold text-white">
                Admin reviews the inquiry, makes calls, and agrees the delivery process.
              </p>
            </div>
            <div className="metric-card">
              <p className="section-label">3. Invite</p>
              <p className="mt-2 text-base font-semibold text-white">
                Approved clients get portal access to create and track their own work.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/8 bg-black/15 p-4">
            <p className="section-label">Public visibility</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                Visitors see service capability and progress, not your full internal ledger.
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                Clients only see their own deliveries and statuses after sign-in.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="shell mt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.zones.map((zone) => (
            <div key={zone.zone} className="panel">
              <p className="section-label">{zone.zone} zone</p>
              <p className="mt-3 text-3xl font-semibold text-white">{zone.total}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {zone.moving} moving / {zone.completed} {getStatusLabel("delivered")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="panel">
            <p className="section-label">Who this is for</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Best for businesses with repeat or managed delivery needs
            </h2>
            <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
              <p>Retail shops with same-day runs and pay-on-delivery collections.</p>
              <p>Food, pharmacy, and service companies that need predictable dispatch.</p>
              <p>Operations teams that want clients and internal staff separated cleanly.</p>
            </div>
          </div>

          <div className="panel">
            <p className="section-label">Today</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Current network snapshot
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="metric-card">
                <p className="section-label">Active client accounts</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {activeClients}
                </p>
              </div>
              <div className="metric-card">
                <p className="section-label">Awaiting dispatch</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {snapshot.metrics.awaitingDispatch}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section id="inquiry">
          <BusinessInquiryForm />
        </section>
      </section>

      <section className="shell mt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className="panel">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-orange-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">{card.title}</h2>
                <p className="copy mt-3">{card.copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
