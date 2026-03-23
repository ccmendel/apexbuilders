import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-xl font-bold gradient-text">Apex Tech</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-gray-300 hover:text-white transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className="gradient-bg px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Join Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-300">500+ students already joined</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight">
          Master <span className="gradient-text">Tech Skills</span> for the{' '}
          <span className="gradient-text">21st Century</span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl">
          Join our exclusive WhatsApp community and learn web development, AI, cybersecurity, 
          and more from industry experts. Level up your career today! 🚀
        </p>

        <Link 
          href="/signup"
          className="group relative gradient-bg px-10 py-5 rounded-full font-bold text-lg animate-pulse-glow hover:animate-none transition-all transform hover:scale-105"
        >
          <span className="flex items-center gap-3">
            Join Now - It's Free
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </Link>

        <p className="text-sm text-gray-500 mt-4">No credit card required • Instant access</p>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            What You'll <span className="gradient-text">Learn</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass rounded-2xl p-8 hover:bg-white/20 transition-colors group">
              <div className="w-14 h-14 gradient-bg rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Web Development</h3>
              <p className="text-gray-400">Learn HTML, CSS, JavaScript, React, Next.js and build real-world projects that impress employers.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-2xl p-8 hover:bg-white/20 transition-colors group">
              <div className="w-14 h-14 gradient-bg rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">AI & Machine Learning</h3>
              <p className="text-gray-400">Understand AI tools, prompt engineering, and how to leverage AI to 10x your productivity.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-2xl p-8 hover:bg-white/20 transition-colors group">
              <div className="w-14 h-14 gradient-bg rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Cybersecurity</h3>
              <p className="text-gray-400">Learn to protect systems, understand ethical hacking, and become security-conscious.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It <span className="gradient-text">Works</span>
          </h2>
          
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                1
              </div>
              <div className="glass rounded-xl p-6 flex-1">
                <h3 className="font-bold text-lg mb-1">Sign Up for Free</h3>
                <p className="text-gray-400">Create your account in 30 seconds. No credit card needed.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                2
              </div>
              <div className="glass rounded-xl p-6 flex-1">
                <h3 className="font-bold text-lg mb-1">Join Our WhatsApp Community</h3>
                <p className="text-gray-400">Get added to our exclusive group with 500+ learners.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                3
              </div>
              <div className="glass rounded-xl p-6 flex-1">
                <h3 className="font-bold text-lg mb-1">Access Premium Video Courses</h3>
                <p className="text-gray-400">Watch our curated video lessons and learn at your own pace.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your <span className="gradient-text">Tech Journey</span>?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of Gen-Z learners building their future in tech.
          </p>
          <Link 
            href="/signup"
            className="inline-flex items-center gap-3 gradient-bg px-10 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Get Started Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold">Apex Tech Academy</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Apex Tech Academy. All rights reserved.</p>
          <Link href="/admin/login" className="text-gray-600 hover:text-gray-400 text-sm">
            Admin
          </Link>
        </div>
      </footer>
    </main>
  )
}
