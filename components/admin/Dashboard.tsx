import Link from "next/link";
import { EVENT_KINDS, type EventKind } from "@/lib/events";
import type { Day, Metrics, Person } from "@/lib/server/metrics";
import LockButton from "./LockButton";

const n = (v: number) => v.toLocaleString("en-US");

function ago(iso: string | null, now: number) {
  if (!iso) return "—";
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-[20px] bg-white/[0.04] p-4">
      <p className="text-[12.5px] text-bone/55">{label}</p>
      <p className="mt-1 font-display text-[28px] leading-none tabular-nums">{n(value)}</p>
      {sub && <p className="mt-2 text-[12px] text-bone/45">{sub}</p>}
    </div>
  );
}

const shortDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** One series per day for the last 30 days, with a hover readout per bar. */
function DailyBars({ title, days, pick }: { title: string; days: Day[]; pick: (d: Day) => number }) {
  const values = days.map(pick);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <figure className="rounded-[20px] bg-white/[0.04] p-4">
      <figcaption className="flex items-baseline justify-between">
        <span className="text-[13.5px]">{title}</span>
        <span className="text-[12px] tabular-nums text-bone/45">{n(total)} in 30 days</span>
      </figcaption>
      <div className="relative mt-4 h-[120px]">
        {/* Recessive guides at the peak and the middle. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-white/[0.07]" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-white/[0.05]" />
        <span className="pointer-events-none absolute -top-2 right-0 bg-transparent text-[10.5px] tabular-nums text-bone/35">
          {n(max)}
        </span>
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {days.map((d, i) => {
            const v = values[i];
            return (
              <div key={d.day} className="group relative flex h-full flex-1 items-end" tabIndex={0} aria-label={`${shortDay(d.day)}: ${v}`}>
                <div
                  className="w-full rounded-t-[4px] bg-ember/85 transition-colors group-hover:bg-ember group-focus:bg-ember"
                  style={{ height: v ? `${Math.max(3, (v / max) * 100)}%` : "2px", opacity: v ? 1 : 0.25 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-raised px-2.5 py-1.5 text-[12px] shadow-lg group-hover:block group-focus:block">
                  <span className="text-bone/55">{shortDay(d.day)}</span>{" "}
                  <span className="tabular-nums text-bone">{n(v)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-bone/35">
        <span>{shortDay(days[0].day)}</span>
        <span>Today</span>
      </div>
    </figure>
  );
}

function Kinds({ byKind }: { byKind: Partial<Record<EventKind, number>> }) {
  const rows = (Object.keys(EVENT_KINDS) as EventKind[]).map((k) => ({ k, v: byKind[k] ?? 0 }));
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="rounded-[20px] bg-white/[0.04] p-4">
      <p className="text-[13.5px]">Actions, last 30 days</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map(({ k, v }) => (
          <li key={k} className="grid grid-cols-[110px_1fr_48px] items-center gap-3 text-[12.5px]">
            <span className="text-bone/60">{EVENT_KINDS[k]}</span>
            <span className="h-2 rounded-full bg-white/[0.05]">
              <span className="block h-full rounded-full bg-ember/85" style={{ width: `${(v / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{n(v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Who({ p }: { p: Person }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {p.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.picture} alt="" referrerPolicy="no-referrer" className="size-7 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ember/20 text-[12px] text-ember">
          {(p.name || p.email).slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px]">
          {p.name}
          {p.username && (
            <Link href={`/profile/${p.username}`} className="ml-1.5 text-bone/40 hover:text-bone/70">
              @{p.username}
            </Link>
          )}
        </p>
        <p className="truncate text-[12px] text-bone/45">{p.email}</p>
      </div>
    </div>
  );
}

function PeopleTable({
  title,
  people,
  now,
  showJoined,
  empty,
}: {
  title: string;
  people: Person[];
  now: number;
  showJoined?: boolean;
  empty: string;
}) {
  const th = "px-3 py-2 text-right font-normal text-bone/45";
  const td = "px-3 py-2.5 text-right tabular-nums";
  return (
    <section className="rounded-[20px] bg-white/[0.04] p-2">
      <h2 className="px-3 pb-1 pt-2 text-[13.5px]">{title}</h2>
      {people.length === 0 ? (
        <p className="px-3 pb-3 pt-1 text-[12.5px] text-bone/45">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-normal text-bone/45">Person</th>
                {showJoined && <th className={th}>Joined</th>}
                <th className={th}>Visits</th>
                <th className={th}>Exports</th>
                <th className={th}>Shares</th>
                <th className={th}>Published</th>
                <th className={th}>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="max-w-[320px] px-3 py-2.5">
                    <Who p={p} />
                  </td>
                  {showJoined && <td className={`${td} text-bone/60`}>{ago(p.joined, now)}</td>}
                  <td className={td}>{n(p.visits)}</td>
                  <td className={td}>{n(p.exports)}</td>
                  <td className={td}>{n(p.shares)}</td>
                  <td className={td}>{n(p.publishes)}</td>
                  <td className={`${td} text-bone/60`}>{ago(p.lastSeen, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Dashboard({ metrics: m, at }: { metrics: Metrics; at: string }) {
  const now = new Date(at).getTime();
  const today = m.days[m.days.length - 1];
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px]">Admin</h1>
          <p className="text-[12.5px] text-bone/45">
            Updated {new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · days in UTC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="press flex h-9 items-center rounded-full bg-white/[0.07] px-4 text-[13px] text-bone/80 hover:bg-white/[0.12] hover:text-bone"
          >
            Studio
          </Link>
          <LockButton />
        </div>
      </header>

      {!m.eventsReady && (
        <p className="mb-4 rounded-[16px] bg-ember/10 px-4 py-3 text-[13px] text-bone/80">
          The database is behind. Run <code className="text-bone">pnpm db:migrate</code> to create the
          event table and missing columns; user numbers below already work.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Users" value={m.users.total} sub={`+${n(m.users.d7)} this week · +${n(m.users.d30)} in 30 days`} />
        <Stat label="Sign-ups today" value={today.signups} sub={`${n(m.users.d1)} in the last 24 hours`} />
        <Stat label="Visitors today" value={m.activity.visitorsToday} sub={`${n(m.activity.visits7)} studio visits this week`} />
        <Stat
          label="Signed-in users active"
          value={m.activity.activeUsers7}
          sub="in the last 7 days"
        />
        <Stat label="Exports this week" value={m.activity.exports7} sub={`${n(m.activity.exportsAll)} all time`} />
        <Stat label="Published designs" value={m.designs.total} sub={`+${n(m.designs.d7)} this week`} />
        <Stat label="Public profiles" value={m.users.publicProfiles} sub={`of ${n(m.users.total)} users`} />
        <Stat
          label="Exports per visitor today"
          value={Number(today.visitors ? (today.exports / today.visitors).toFixed(2) : 0)}
          sub={`${n(today.exports)} exports today`}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <DailyBars title="Visitors per day" days={m.days} pick={(d) => d.visitors} />
        <DailyBars title="Sign-ups per day" days={m.days} pick={(d) => d.signups} />
        <DailyBars title="Exports per day" days={m.days} pick={(d) => d.exports} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_2fr]">
        <Kinds byKind={m.activity.byKind} />
        <PeopleTable
          title="Most active users, last 30 days"
          people={m.topUsers}
          now={now}
          empty="No signed-in activity yet."
        />
      </div>

      <div className="mt-3">
        <PeopleTable title="Newest users" people={m.recentUsers} now={now} showJoined empty="No users yet." />
      </div>
    </div>
  );
}
