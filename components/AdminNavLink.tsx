'use client';

import { useEffect, useState } from 'react';

export default function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          if (isMounted) setChecked(true);
          return;
        }

        const body = await res.json();
        if (!isMounted) return;

        const profile = body?.data;
        if (profile?.role === 'admin' || profile?.role === 'moderator' || profile?.isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Failed to check admin status:', error);
      } finally {
        if (isMounted) setChecked(true);
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!checked || !isAdmin) {
    return null;
  }

  return (
    <a href="/admin" className="hover:underline hover:text-primary">
      Admin
    </a>
  );
}
