import Link from "next/link";

export default function MessagesPage() {
  // Placeholder conversations data
  const conversations = [
    {
      userId: 101,
      name: "Alice Johnson",
      lastMessage: "Hey, are we still on for tomorrow?",
      time: "Oct 28, 2025 10:15 AM",
    },
    {
      userId: 102,
      name: "Bob Smith",
      lastMessage: "Got it, thanks for the update!",
      time: "Oct 27, 2025 5:42 PM",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Conversations</h1>
      {conversations.length > 0 ? (
        <ul className="space-y-3">
          {conversations.map((conv) => (
            <li key={conv.userId}>
              <Link 
                href={`/messages/${conv.userId}`} 
                className="block rounded-lg border bg-white p-4 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-700">{conv.name}</span>
                  <span className="text-xs text-gray-500">{conv.time}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                  {conv.lastMessage}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No conversations yet.</p>
      )}
    </main>
  );
}
