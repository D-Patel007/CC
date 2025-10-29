"use client";

import { useState } from "react";

export default function NewEventPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Attempt to post to an API route (not implemented yet)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setLoading(false);
      if (res.ok) {
        // Redirect to events list after successful post
        window.location.href = "/events";
      }
    } catch {
      setLoading(false);
      // In a real implementation, handle errors (e.g., show a message)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Post a New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          type="text"
          placeholder="Event Title"
          required
          className="w-full rounded-xl border p-3"
        />
        <textarea
          name="description"
          placeholder="Event Description"
          rows={4}
          required
          className="w-full rounded-xl border p-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="date"
            type="date"
            required
            className="rounded-xl border p-3"
          />
          <input
            name="location"
            type="text"
            placeholder="Location"
            required
            className="rounded-xl border p-3"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post Event"}
        </button>
      </form>
    </main>
  );
}
