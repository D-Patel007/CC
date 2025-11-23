export default function Footer() {
  return (
    <footer className="bg-[var(--background-elevated)] border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="/about" className="hover:text-primary transition-colors">
                About
              </a>
              <a href="/help" className="hover:text-primary transition-colors">
                Help Center
              </a>
              <a href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © 2024 Campus Connect. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
