import "server-only";
import { avatarUrl } from "@/lib/avatar";
import { EXPORT_KINDS, type EventKind } from "@/lib/events";
import { pool } from "./auth-options";

export type Person = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  picture: string | null;
  joined: string;
  lastSeen: string | null;
  visits: number;
  exports: number;
  shares: number;
  publishes: number;
  events: number;
};

export type Day = { day: string; visitors: number; signups: number; exports: number };

export type Metrics = {
  users: { total: number; d1: number; d7: number; d30: number; publicProfiles: number };
  designs: { total: number; d7: number };
  /** False until `pnpm db:migrate` has created the event table. */
  eventsReady: boolean;
  activity: {
    visitorsToday: number;
    visits7: number;
    activeUsers7: number;
    exports7: number;
    exportsAll: number;
    byKind: Partial<Record<EventKind, number>>;
  };
  days: Day[];
  topUsers: Person[];
  recentUsers: Person[];
};

type PersonRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  username: string | null;
  avatar_seed: string | null;
  joined: Date;
  last_seen: Date | null;
  visits: number;
  exports: number;
  shares: number;
  publishes: number;
  events: number;
};

const person = (r: PersonRow): Person => ({
  id: r.id,
  name: r.name,
  email: r.email,
  username: r.username,
  picture: r.avatar_seed ? avatarUrl(r.avatar_seed) : r.image,
  joined: new Date(r.joined).toISOString(),
  lastSeen: r.last_seen ? new Date(r.last_seen).toISOString() : null,
  visits: r.visits ?? 0,
  exports: r.exports ?? 0,
  shares: r.shares ?? 0,
  publishes: r.publishes ?? 0,
  events: r.events ?? 0,
});

// Per-user counts over a window of events `e`; $1 is the export kinds.
const COUNTS = `
  count(e.id)::int as events,
  count(e.id) filter (where e.kind = 'visit')::int as visits,
  count(e.id) filter (where e.kind = any($1))::int as exports,
  count(e.id) filter (where e.kind = 'share')::int as shares,
  count(e.id) filter (where e.kind = 'publish')::int as publishes,
  max(e.at) as last_seen`;

const DAYS = 30;

function emptyDays(): Day[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: DAYS }, (_, i) => ({
    day: new Date(today.getTime() - (DAYS - 1 - i) * 864e5).toISOString().slice(0, 10),
    visitors: 0,
    signups: 0,
    exports: 0,
  }));
}

/** Everything the admin dashboard shows, in one round of queries. */
export async function loadMetrics(): Promise<Metrics> {
  const db = pool();
  const [users, designs, signups] = await Promise.all([
    db.query(`
      select count(*)::int as total,
             count(*) filter (where "createdAt" >= now() - interval '1 day')::int as d1,
             count(*) filter (where "createdAt" >= now() - interval '7 days')::int as d7,
             count(*) filter (where "createdAt" >= now() - interval '30 days')::int as d30,
             (select count(*)::int from profile where is_public) as public_profiles
      from "user"`),
    db.query(`
      select count(*)::int as total,
             count(*) filter (where created_at >= now() - interval '7 days')::int as d7
      from design`),
    db.query(`
      select to_char(date_trunc('day', "createdAt" at time zone 'UTC'), 'YYYY-MM-DD') as day, count(*)::int as n
      from "user" where "createdAt" >= now() - interval '${DAYS} days' group by 1`),
  ]);

  const days = emptyDays();
  const byDay = new Map(days.map((d) => [d.day, d]));
  for (const r of signups.rows) {
    const d = byDay.get(r.day);
    if (d) d.signups = r.n;
  }

  const u = users.rows[0];
  const base: Metrics = {
    users: { total: u.total, d1: u.d1, d7: u.d7, d30: u.d30, publicProfiles: u.public_profiles },
    designs: { total: designs.rows[0].total, d7: designs.rows[0].d7 },
    eventsReady: true,
    activity: { visitorsToday: 0, visits7: 0, activeUsers7: 0, exports7: 0, exportsAll: 0, byKind: {} },
    days,
    topUsers: [],
    recentUsers: [],
  };

  try {
    const [summary, kinds, daily, top, recent] = await Promise.all([
      db.query(
        `select count(distinct visitor) filter (where at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC')::int as visitors_today,
                count(*) filter (where kind = 'visit' and at >= now() - interval '7 days')::int as visits7,
                count(distinct user_id) filter (where at >= now() - interval '7 days')::int as active_users7,
                count(*) filter (where kind = any($1) and at >= now() - interval '7 days')::int as exports7,
                count(*) filter (where kind = any($1))::int as exports_all
         from event`,
        [EXPORT_KINDS],
      ),
      db.query(`select kind, count(*)::int as n from event where at >= now() - interval '${DAYS} days' group by kind`),
      db.query(
        `select to_char(date_trunc('day', at at time zone 'UTC'), 'YYYY-MM-DD') as day,
                count(distinct visitor)::int as visitors,
                count(*) filter (where kind = any($1))::int as exports
         from event where at >= now() - interval '${DAYS} days' group by 1`,
        [EXPORT_KINDS],
      ),
      db.query<PersonRow>(
        `select u.id, u.name, u.email, u.image, p.username, p.avatar_seed, u."createdAt" as joined, ${COUNTS}
         from event e join "user" u on u.id = e.user_id left join profile p on p.user_id = u.id
         where e.at >= now() - interval '${DAYS} days'
         group by u.id, p.username, p.avatar_seed
         order by events desc, last_seen desc
         limit 25`,
        [EXPORT_KINDS],
      ),
      db.query<PersonRow>(
        `select u.id, u.name, u.email, u.image, p.username, p.avatar_seed, u."createdAt" as joined, ${COUNTS}
         from "user" u left join profile p on p.user_id = u.id left join event e on e.user_id = u.id
         group by u.id, p.username, p.avatar_seed
         order by u."createdAt" desc
         limit 20`,
        [EXPORT_KINDS],
      ),
    ]);
    const s = summary.rows[0];
    base.activity = {
      visitorsToday: s.visitors_today,
      visits7: s.visits7,
      activeUsers7: s.active_users7,
      exports7: s.exports7,
      exportsAll: s.exports_all,
      byKind: Object.fromEntries(kinds.rows.map((r) => [r.kind, r.n])),
    };
    for (const r of daily.rows) {
      const d = byDay.get(r.day);
      if (d) Object.assign(d, { visitors: r.visitors, exports: r.exports });
    }
    base.topUsers = top.rows.map(person);
    base.recentUsers = recent.rows.map(person);
  } catch (e) {
    // 42P01 / 42703: a table or column is missing, the database is behind `pnpm db:migrate`.
    const code = (e as { code?: string }).code;
    if (code !== "42P01" && code !== "42703") throw e;
    base.eventsReady = false;
    const recent = await db.query<PersonRow>(
      `select id, name, email, image, null as username, null as avatar_seed, "createdAt" as joined, null as last_seen
       from "user" order by "createdAt" desc limit 20`,
    );
    base.recentUsers = recent.rows.map(person);
  }
  return base;
}
