'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
  description: string
  learning_objective?: string | null
  youtube_url: string
  thumbnail_url: string
  created_at: string
}

interface CurriculumItem {
  id: string
  course_id: string
  subheading: string
  description?: string | null
  video_url: string
  pdf_url?: string | null
  extra_text?: string | null
  position: number
}

interface CourseWithCurriculum extends Course {
  curriculum: CurriculumItem[]
}

interface UserData {
  name: string
  email: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [courses, setCourses] = useState<CourseWithCurriculum[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      setUser({
        name: authUser.user_metadata?.name || 'User',
        email: authUser.email || ''
      })

      // Fetch courses and curriculum
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: curriculumData } = await supabase
        .from('course_curriculum_items')
        .select('*')
        .order('position', { ascending: true })

      if (coursesData) {
        const grouped = new Map<string, CurriculumItem[]>()

        for (const item of (curriculumData || []) as CurriculumItem[]) {
          const existing = grouped.get(item.course_id) || []
          existing.push(item)
          grouped.set(item.course_id, existing)
        }

        const merged = (coursesData as Course[]).map((course) => ({
          ...course,
          curriculum: grouped.get(course.id) || [],
        }))

        setCourses(merged)
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold gradient-text">ApexBuilders</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-gray-400">Continue learning and leveling up your skills.</p>
        </div>

        {/* Info Card */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">WhatsApp Community</h3>
              <p className="text-gray-400 text-sm">
                Our admin will add you to the WhatsApp group soon! Make sure your phone number is correct.
                You'll receive updates, tips, and connect with other learners.
              </p>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Courses</h2>
          
          {courses.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-gray-400">New courses will appear here soon. Stay tuned!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.map((course) => {
                const videoId = getYouTubeId(course.youtube_url)
                const thumbnail = course.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null)
                
                return (
                  <div key={course.id} className="glass rounded-2xl overflow-hidden group hover:bg-white/20 transition-colors">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-800">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{course.description}</p>
                      {course.learning_objective && (
                        <p className="text-sm mb-4"><span className="text-gray-400">Learning objective:</span> {course.learning_objective}</p>
                      )}

                      <div className="mb-3">
                        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                          {course.curriculum.length} lessons
                        </span>
                      </div>

                      <div className="space-y-3">
                        {course.curriculum.length === 0 ? (
                          <a
                            href={course.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 gradient-bg px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                          >
                            Watch Course Intro
                          </a>
                        ) : (
                          course.curriculum.map((lesson, index) => (
                            <div key={lesson.id} className="rounded-xl bg-white/5 p-3">
                              <p className="font-semibold text-sm">{index + 1}. {lesson.subheading}</p>
                              {lesson.description && <p className="text-xs text-gray-400 mt-1">{lesson.description}</p>}
                              {lesson.extra_text && <p className="text-xs text-gray-300 mt-1">{lesson.extra_text}</p>}

                              <div className="flex flex-wrap gap-2 mt-2">
                                <a
                                  href={lesson.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded-lg gradient-bg text-xs font-semibold"
                                >
                                  Watch Video
                                </a>
                                {lesson.pdf_url && (
                                  <a
                                    href={lesson.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold"
                                  >
                                    Open PDF
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
