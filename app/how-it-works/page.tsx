export default function HowItWorksPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">How Campus Connect Works</h1>
        <p className="text-foreground-secondary">
          Quickly post listings, RSVP for events, and stay connected with other students through messages and real-time notifications.
        </p>
      </header>

      <ol className="space-y-4 text-foreground">
        <li>
          <span className="font-medium">1. Create your profile:</span> Complete your profile so buyers and event organizers know who they&rsquo;re working with.
        </li>
        <li>
          <span className="font-medium">2. Add listings or events:</span> Share what you&rsquo;re selling or invite classmates to upcoming meetups in just a few clicks.
        </li>
        <li>
          <span className="font-medium">3. Coordinate in messages:</span> Use the in-app inbox to iron out details and keep everything organized.
        </li>
        <li>
          <span className="font-medium">4. Stay notified:</span> You&rsquo;ll receive instant alerts when someone reaches out, RSVPs, or updates an event you&rsquo;re attending.
        </li>
      </ol>

      <p className="text-foreground-secondary">
        Need help getting started? Check the onboarding guide in the resources section or reach out to the campus team anytime.
      </p>
    </section>
  );
}
