import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";  // Ensure fresh data on each request (no caching)

export default async function EventsPage() {
  // Try to load events from the database; fall back to placeholder data if not available
  let events: {
    id: number | string;
    title: string;
    description: string;
    date: string;
    location: string;
    postedBy: string;
  }[] = [];

  try {
    events = await prisma.event.findMany({
      orderBy: { date: "asc" },  // upcoming events first
      take: 50,
    });
  } catch {
    // Placeholder events (since no Event model or data yet)
    events = [
      {
        id: 1,
        title: "Campus Career Fair",
        description: "Meet recruiters from top companies and explore internship opportunities.",
        date: "Nov 10, 2025",
        location: "Student Center Hall A",
        postedBy: "John Doe",
      },
      {
        id: 2,
        title: "Hackathon Weekend",
        description: "48-hour coding marathon with prizes for the top projects. All skill levels welcome!",
        date: "Dec 5, 2025",
        location: "Engineering Lab 2",
        postedBy: "Jane Smith",
      },
    ];
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* Page header with title and "Post Event" button */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Link
          href="/events/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Post New Event
        </Link>
      </header>

      {/* Events list */}
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li 
              key={event.id} 
              className="rounded-xl border bg-white p-4 hover:bg-blue-50"
            >
              <h3 className="text-lg font-medium text-blue-800">{event.title}</h3>
              <p className="text-gray-700 mb-1">{event.description}</p>
              <div className="text-sm text-gray-600">
                <span>{event.date}</span> &nbsp;•&nbsp; <span>{event.location}</span> &nbsp;•&nbsp;{" "}
                <span>Posted by {event.postedBy}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No events available.</p>
      )}
    </main>
  );
}
