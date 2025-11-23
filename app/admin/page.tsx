import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/supabase/server';

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

export default async function AdminDashboardPage() {
  const supabase = await sbServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: adminProfile } = await supabase
    .from('Profile')
    .select('id, name, role, isSuspended')
    .eq('supabaseId', user.id)
    .single();

  if (!adminProfile || adminProfile.role !== 'admin' || adminProfile.isSuspended) {
    redirect('/');
  }

  const [totalUsersRes, adminCountRes, suspendedCountRes, listingsCountRes] = await Promise.all([
    supabase.from('Profile').select('id', { count: 'exact', head: true }),
    supabase.from('Profile').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('Profile').select('id', { count: 'exact', head: true }).eq('isSuspended', true),
    supabase.from('Listing').select('id', { count: 'exact', head: true }),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const adminCount = adminCountRes.count ?? 0;
  const suspendedCount = suspendedCountRes.count ?? 0;
  const totalListings = listingsCountRes.count ?? 0;

  const cards = [
    {
      title: 'Total Users',
      value: formatNumber(totalUsers),
      description: 'Registered profiles in the community.',
    },
    {
      title: 'Active Admins',
      value: formatNumber(adminCount),
      description: 'Accounts with full admin privileges.',
    },
    {
      title: 'Suspended Accounts',
      value: formatNumber(suspendedCount),
      description: 'Users currently blocked from activity.',
      highlight: suspendedCount > 0,
    },
    {
      title: 'Live Listings',
      value: formatNumber(totalListings),
      description: 'Marketplace items currently published.',
    },
  ];

  const tools = [
    {
      title: 'User Management',
      description: 'Review accounts, promote admins, and handle suspensions.',
      href: '/admin/users',
      action: 'Open user management',
    },
    {
      title: 'Moderation Queue',
      description: 'Process flagged content and manage strikes.',
      href: '/admin/moderation',
      action: 'Manage moderation',
    },
    {
      title: 'Prohibited Items',
      description: 'Update filter patterns and enforcement rules.',
      href: '/admin/prohibited-items',
      action: 'Edit prohibited items',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-foreground-secondary">Welcome back, {adminProfile.name || 'Admin'}.</p>
        <h1 className="text-3xl font-bold text-foreground">Admin Control Center</h1>
        <p className="text-foreground-secondary">
          Review platform health, manage the team, and keep Campus Connect running smoothly.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-lg border border-border bg-card p-5 shadow-sm transition-colors ${
              card.highlight ? 'border-red-300 dark:border-red-900/40' : ''
            }`}
          >
            <div className="text-sm font-medium text-foreground-secondary">{card.title}</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{card.value}</div>
            <p className="mt-2 text-sm text-foreground-secondary">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Admin Tools</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="flex h-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div>
                <div className="text-lg font-semibold text-foreground">{tool.title}</div>
                <p className="mt-2 text-sm text-foreground-secondary">{tool.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center text-sm font-medium text-primary">
                {tool.action} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
