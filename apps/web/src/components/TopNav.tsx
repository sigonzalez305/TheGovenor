export function TopNav() {
  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-xl font-bold">
              DC Internet Listener
            </a>
            <div className="hidden md:flex space-x-4">
              <a href="/" className="hover:text-gray-300">
                Overview
              </a>
              <a href="/dashboard" className="hover:text-gray-300">
                Dashboard
              </a>
              <a href="/daily" className="hover:text-gray-300">
                Daily
              </a>
              <a href="/events" className="hover:text-gray-300">
                Events
              </a>
              <a href="/alerts" className="hover:text-gray-300">
                Alerts
              </a>
              <a href="/search" className="hover:text-gray-300">
                Search
              </a>
              <a href="/sources" className="hover:text-gray-300">
                Sources
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
