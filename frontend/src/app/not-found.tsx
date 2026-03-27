import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
      {/* Navbar */}
      <nav className="w-full px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon-light.png" alt="TelecomCo" className="h-8 w-8" />
          <span className="text-lg font-bold text-[#0A3963] tracking-tight">
            Telecom<span className="text-[#0AA4B0]">Co</span>
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#0A3963]">
          <Link href="/" className="hover:text-[#0AA4B0] transition-colors">Home</Link>
          <Link href="/#features" className="hover:text-[#0AA4B0] transition-colors">Features</Link>
          <Link href="/#how-it-works" className="hover:text-[#0AA4B0] transition-colors">How It Works</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <img
          src="/404-illustration.png"
          alt="404"
          className="w-full max-w-lg h-auto mb-8"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A3963] mb-2">
          Signal Lost! We Couldn't Connect You.
        </h1>
        <p className="text-gray-500 max-w-md mb-8">
          It seems the insights you were tracking have disconnected. We are searching for them now.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#0AA4B0] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#089da6] transition-colors"
        >
          Return to Homepage
        </Link>
      </div>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-4 flex items-center justify-between text-sm text-gray-400">
        <div className="flex gap-4">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <Link href="/#features" className="hover:text-gray-600">Features</Link>
          <Link href="/#how-it-works" className="hover:text-gray-600">How It Works</Link>
        </div>
        <span>Copyright &copy; TelecomCo Inc.</span>
      </footer>
    </div>
  )
}
