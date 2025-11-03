export default function Footer() {
  return (
    <footer className="border-t-2 border-border bg-[var(--background-secondary)] mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-modern bg-primary text-white flex items-center justify-center font-bold shadow-lg text-xl">
                CC
              </div>
              <div>
                <div className="font-bold text-foreground">Campus Connect</div>
                <div className="text-xs text-primary font-medium">For Beacons, by Beacons</div>
              </div>
            </div>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              The student marketplace built for UMass Boston. Buy, sell, trade, and connect with fellow Beacons.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-foreground-secondary hover:text-primary transition">Marketplace</a></li>
              <li><a href="/events" className="text-foreground-secondary hover:text-primary transition">Events</a></li>
              <li><a href="/messages" className="text-foreground-secondary hover:text-primary transition">Messages</a></li>
              <li><a href="/my" className="text-foreground-secondary hover:text-primary transition">My Listings</a></li>
              <li><a href="/profile" className="text-foreground-secondary hover:text-primary transition">Profile</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://www.umb.edu" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-primary transition">UMass Boston</a></li>
              <li><a href="https://www.umb.edu/campus-life" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-primary transition">Campus Life</a></li>
              <li><a href="https://www.umb.edu/sustainability" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-primary transition">Sustainability</a></li>
              <li><a href="mailto:campusconnectcapstone@gmail.com" className="text-foreground-secondary hover:text-primary transition">Contact Us</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Connect</h3>
            <div className="space-y-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/umb_campusconnect"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground-secondary hover:text-primary transition group"
              >
                <div className="w-10 h-10 rounded-modern bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all">
                  <svg className="h-5 w-5 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">@umb_campusconnect</span>
              </a>

              {/* Email */}
              <a
                href="mailto:campusconnectcapstone@gmail.com"
                className="flex items-center gap-3 text-foreground-secondary hover:text-primary transition group"
              >
                <div className="w-10 h-10 rounded-modern bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all">
                  <svg className="h-5 w-5 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Email Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground-secondary">
          <p>© 2025 Campus Connect. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition">Terms of Service</a>
            <a href="https://www.umb.edu/accessibility-statement" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
