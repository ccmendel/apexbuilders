'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  name: string
  email: string
  phone: string
  country: string
  added_to_whatsapp: boolean
  is_suspended?: boolean
  suspended_at?: string | null
  created_at: string
}

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
  created_at: string
}

interface CourseWithCurriculum extends Course {
  curriculum: CurriculumItem[]
}

interface CurriculumDraft {
  subheading: string
  description: string
  video_url: string
  pdf_url: string
  extra_text: string
}

interface AdminAccount {
  id: string
  name: string
  email: string
  created_at: string
}

interface Campaign {
  id: string
  subject: string
  segment: 'all' | 'pending' | 'added'
  total_recipients: number
  sent_count: number
  failed_count: number
  created_by: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'admins' | 'analytics' | 'ops' | 'campaigns'>('analytics')
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<CourseWithCurriculum[]>([])
  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    learning_objective: '',
    curriculum: [
      {
        subheading: '',
        description: '',
        video_url: '',
        pdf_url: '',
        extra_text: '',
      },
    ] as CurriculumDraft[],
  })
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseError, setCourseError] = useState('')
  const [uploadingPdfIndex, setUploadingPdfIndex] = useState<number | null>(null)
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    body: '',
    segment: 'all' as 'all' | 'pending' | 'added',
  })
  const [sendingCampaign, setSendingCampaign] = useState(false)
  const [campaignMessage, setCampaignMessage] = useState('')
  const [campaignError, setCampaignError] = useState('')
  const [currentAdminEmail, setCurrentAdminEmail] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'added'>('all')
  const router = useRouter()

  useEffect(() => {
    async function bootstrap() {
      const response = await fetch('/api/admin/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        router.push('/admin/login')
        return
      }

      const data = await response.json()
      setCurrentAdminEmail(data?.admin?.email || '')
      await loadData()
    }

    bootstrap()
  }, [router])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    
    // Fetch users
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersData) {
      setUsers(usersData)
    }

    // Fetch courses
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
        const current = grouped.get(item.course_id) || []
        current.push(item)
        grouped.set(item.course_id, current)
      }

      const merged = (coursesData as Course[]).map((course) => ({
        ...course,
        curriculum: grouped.get(course.id) || [],
      }))

      setCourses(merged)
    }

    const adminsResponse = await fetch('/api/admin/admins', {
      credentials: 'include',
    })

    if (adminsResponse.ok) {
      const adminsData = await adminsResponse.json()
      setAdmins(adminsData.admins || [])
    }

    const campaignsResponse = await fetch('/api/admin/campaigns', {
      credentials: 'include',
    })

    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json()
      setCampaigns(campaignsData.campaigns || [])
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  const toggleWhatsAppStatus = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ added_to_whatsapp: !currentStatus })
      .eq('id', userId)

    if (!error) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, added_to_whatsapp: !currentStatus } : user
      ))
    }
  }

  const handleSuspendUser = async (userId: string, currentlySuspended: boolean) => {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ suspend: !currentlySuspended }),
    })

    if (response.ok) {
      setUsers(users.map((user) => user.id === userId
        ? {
            ...user,
            is_suspended: !currentlySuspended,
            suspended_at: !currentlySuspended ? new Date().toISOString() : null,
          }
        : user
      ))
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const shouldDelete = confirm(`Delete ${userEmail} completely? This will remove auth + database records and allow re-registration with same email.`)
    if (!shouldDelete) {
      return
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (response.ok) {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCourseError('')

    const trimmedCurriculum = courseForm.curriculum.map((item) => ({
      ...item,
      subheading: item.subheading.trim(),
      description: item.description.trim(),
      video_url: item.video_url.trim(),
      pdf_url: item.pdf_url.trim(),
      extra_text: item.extra_text.trim(),
    }))

    if (trimmedCurriculum.length === 0) {
      setCourseError('Add at least one curriculum item.')
      return
    }

    const hasInvalidItem = trimmedCurriculum.some((item) => !item.subheading || !item.video_url)
    if (hasInvalidItem) {
      setCourseError('Each curriculum item needs a subheading and video URL.')
      return
    }

    setSavingCourse(true)
    const supabase = createClient()

    const { data: courseData, error } = await supabase
      .from('courses')
      .insert({
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        learning_objective: courseForm.learning_objective.trim(),
        youtube_url: trimmedCurriculum[0].video_url,
      })
      .select('id')
      .single()

    if (!error && courseData?.id) {
      const curriculumPayload = trimmedCurriculum.map((item, index) => ({
        course_id: courseData.id,
        subheading: item.subheading,
        description: item.description || null,
        video_url: item.video_url,
        pdf_url: item.pdf_url || null,
        extra_text: item.extra_text || null,
        position: index,
      }))

      const { error: curriculumError } = await supabase
        .from('course_curriculum_items')
        .insert(curriculumPayload)

      if (curriculumError) {
        setCourseError('Course created, but failed to save curriculum. Please edit and retry.')
        setSavingCourse(false)
        await loadData()
        return
      }

      setCourseForm({
        title: '',
        description: '',
        learning_objective: '',
        curriculum: [
          {
            subheading: '',
            description: '',
            video_url: '',
            pdf_url: '',
            extra_text: '',
          },
        ],
      })
      setShowAddCourse(false)
      loadData()
    } else if (error) {
      setCourseError('Failed to save course. Please check your schema and try again.')
    }

    setSavingCourse(false)
  }

  const updateCurriculumItem = (index: number, key: keyof CurriculumDraft, value: string) => {
    setCourseForm((prev) => {
      const next = [...prev.curriculum]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, curriculum: next }
    })
  }

  const addCurriculumItem = () => {
    setCourseForm((prev) => ({
      ...prev,
      curriculum: [
        ...prev.curriculum,
        {
          subheading: '',
          description: '',
          video_url: '',
          pdf_url: '',
          extra_text: '',
        },
      ],
    }))
  }

  const removeCurriculumItem = (index: number) => {
    setCourseForm((prev) => {
      if (prev.curriculum.length === 1) {
        return prev
      }

      return {
        ...prev,
        curriculum: prev.curriculum.filter((_, itemIndex) => itemIndex !== index),
      }
    })
  }

  const uploadCurriculumPdf = async (index: number, file: File) => {
    setUploadingPdfIndex(index)
    setCourseError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json().catch(() => ({ error: 'Failed to upload PDF' }))
      if (!response.ok) {
        setCourseError(data.error || 'Failed to upload PDF')
        return
      }

      updateCurriculumItem(index, 'pdf_url', data.publicUrl || '')
    } finally {
      setUploadingPdfIndex(null)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAdmin(true)
    setAdminError('')

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(adminForm),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to create admin' }))
        setAdminError(data.error || 'Failed to create admin')
        setSavingAdmin(false)
        return
      }

      setAdminForm({ name: '', email: '', password: '' })
      setShowAddAdmin(false)
      await loadData()
    } finally {
      setSavingAdmin(false)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    const supabase = createClient()

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (!error) {
      setCourses(courses.filter(c => c.id !== courseId))
    }
  }

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setCampaignError('')
    setCampaignMessage('')
    setSendingCampaign(true)

    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(campaignForm),
      })

      const data = await response.json().catch(() => ({ error: 'Failed to send campaign' }))
      if (!response.ok) {
        setCampaignError(data.error || 'Failed to send campaign')
        return
      }

      setCampaignMessage(`Campaign sent: ${data.sentCount}/${data.totalRecipients} delivered`)
      setCampaignForm({ subject: '', body: '', segment: 'all' })
      await loadData()
    } finally {
      setSendingCampaign(false)
    }
  }

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
    } catch {
      // ignore clipboard failures
    }
  }

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank', 'noopener,noreferrer')
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'pending') return !user.added_to_whatsapp
    if (filter === 'added') return user.added_to_whatsapp
    return true
  })

  const stats = {
    total: users.length,
    pending: users.filter(u => !u.added_to_whatsapp).length,
    added: users.filter(u => u.added_to_whatsapp).length
  }

  const conversionRate = stats.total > 0 ? Math.round((stats.added / stats.total) * 100) : 0
  const pendingRate = stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0
  const thisWeekCount = users.filter((user) => {
    const createdAt = new Date(user.created_at).getTime()
    return createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000
  }).length

  const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (6 - index))
    const next = new Date(day)
    next.setDate(next.getDate() + 1)

    const count = users.filter((user) => {
      const timestamp = new Date(user.created_at).getTime()
      return timestamp >= day.getTime() && timestamp < next.getTime()
    }).length

    return {
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      count,
    }
  })

  const maxWeeklyCount = Math.max(...weeklyTrend.map((day) => day.count), 1)
  const pendingUsers = users.filter((user) => !user.added_to_whatsapp).slice(0, 20)
  const totalCurriculumItems = courses.reduce((total, course) => total + course.curriculum.length, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-lg">Loading admin dashboard...</span>
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
            <span className="text-xl font-bold gradient-text">Admin Panel</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-gray-400">Total Users</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.pending}</p>
                <p className="text-gray-400">Pending WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.added}</p>
                <p className="text-gray-400">Added to WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
          <aside className="glass rounded-2xl p-3 lg:sticky lg:top-24">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'analytics' ? 'gradient-bg' : 'hover:bg-white/10'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'users' ? 'gradient-bg' : 'hover:bg-white/10'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'courses' ? 'gradient-bg' : 'hover:bg-white/10'
                }`}
              >
                Courses
              </button>
              <button
                onClick={() => setActiveTab('ops')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'ops' ? 'gradient-bg' : 'hover:bg-white/10'
                }`}
              >
                WhatsApp Ops
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'campaigns' ? 'gradient-bg' : 'hover:bg-white/10'
                }`}
              >
                Broadcast
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'admins' ? 'gradient-bg' : 'hover:bg-white/10'
                }`}
              >
                Admins
              </button>
            </div>
          </aside>

          <section className="space-y-6">
            {activeTab === 'analytics' && (
              <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-5">
                <p className="text-sm text-gray-400">Signup → WhatsApp Conversion</p>
                <p className="text-3xl font-bold mt-1">{conversionRate}%</p>
              </div>
              <div className="glass rounded-xl p-5">
                <p className="text-sm text-gray-400">Pending WhatsApp Rate</p>
                <p className="text-3xl font-bold mt-1">{pendingRate}%</p>
              </div>
              <div className="glass rounded-xl p-5">
                <p className="text-sm text-gray-400">New Signups (7 days)</p>
                <p className="text-3xl font-bold mt-1">{thisWeekCount}</p>
              </div>
              <div className="glass rounded-xl p-5">
                <p className="text-sm text-gray-400">Courses Published</p>
                <p className="text-3xl font-bold mt-1">{courses.length}</p>
              </div>
              <div className="glass rounded-xl p-5 md:col-span-2 lg:col-span-1">
                <p className="text-sm text-gray-400">Total Curriculum Lessons</p>
                <p className="text-3xl font-bold mt-1">{totalCurriculumItems}</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Weekly Signup Trend</h3>
                <span className="text-sm text-gray-400">Last 7 days</span>
              </div>
              <div className="grid grid-cols-7 gap-3 items-end h-44">
                {weeklyTrend.map((day) => (
                  <div key={day.label} className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-300">{day.count}</div>
                    <div
                      className="w-full gradient-bg rounded-t-md"
                      style={{ height: `${Math.max((day.count / maxWeeklyCount) * 130, 8)}px` }}
                    />
                    <div className="text-xs text-gray-500">{day.label}</div>
                  </div>
                ))}
              </div>
            </div>
              </div>
            )}

            {activeTab === 'ops' && (
              <div className="space-y-4">
            <div className="glass rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">WhatsApp Operations Queue</h3>
                <p className="text-sm text-gray-400">Fast workflow for adding users to the community</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-semibold">
                {pendingUsers.length} Pending
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center text-gray-400">No pending users 🎉</div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email} • {user.country}</p>
                      <p className="text-sm text-green-300">{user.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyPhone(user.phone)}
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
                      >
                        Copy Phone
                      </button>
                      <button
                        onClick={() => openWhatsApp(user.phone)}
                        className="px-3 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 text-sm font-medium"
                      >
                        Open WhatsApp
                      </button>
                      <button
                        onClick={() => toggleWhatsAppStatus(user.id, user.added_to_whatsapp)}
                        className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-sm font-medium"
                      >
                        Mark Added
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Broadcast Email Campaign</h3>

              {campaignError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">{campaignError}</div>
              )}
              {campaignMessage && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4 text-green-300 text-sm">{campaignMessage}</div>
              )}

              <form onSubmit={handleSendCampaign} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                      placeholder="New week challenge is live 🚀"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Audience</label>
                    <select
                      value={campaignForm.segment}
                      onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value as 'all' | 'pending' | 'added' })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="all" className="bg-slate-900">All Users</option>
                      <option value="pending" className="bg-slate-900">Pending WhatsApp</option>
                      <option value="added" className="bg-slate-900">Added to WhatsApp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={campaignForm.body}
                    onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="Write your campaign update, launch message, or reminder..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingCampaign}
                  className="gradient-bg px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {sendingCampaign ? 'Sending...' : 'Send Campaign'}
                </button>
              </form>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h4 className="font-bold">Recent Campaigns</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Segment</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Delivered</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Failed</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No campaigns sent yet</td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-white/5">
                          <td className="px-6 py-3">{campaign.subject}</td>
                          <td className="px-6 py-3 capitalize text-gray-300">{campaign.segment}</td>
                          <td className="px-6 py-3 text-green-300">{campaign.sent_count}/{campaign.total_recipients}</td>
                          <td className="px-6 py-3 text-red-300">{campaign.failed_count}</td>
                          <td className="px-6 py-3 text-gray-400 text-sm">{new Date(campaign.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
            {/* Filter */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('added')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'added' ? 'bg-green-500/30 text-green-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Added ({stats.added})
              </button>
            </div>

            {/* Users Table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Country</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">WhatsApp</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium">{user.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <a 
                              href={`mailto:${user.email}`} 
                              className="text-purple-400 hover:text-purple-300"
                            >
                              {user.email}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <a 
                              href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 flex items-center gap-2"
                            >
                              {user.phone}
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </a>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{user.country}</td>
                          <td className="px-6 py-4">
                            {user.is_suspended ? (
                              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold">Suspended</span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">Active</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleWhatsAppStatus(user.id, user.added_to_whatsapp)}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                user.added_to_whatsapp
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              }`}
                            >
                              {user.added_to_whatsapp ? '✓ Added' : 'Mark Added'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSuspendUser(user.id, !!user.is_suspended)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                  user.is_suspended
                                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                                }`}
                              >
                                {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div>
            {/* Add Course Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddCourse(true)}
                className="gradient-bg px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Course
              </button>
            </div>

            {/* Add Course Modal */}
            {showAddCourse && (
              <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
                <div className="glass rounded-2xl p-8 max-w-4xl w-full my-6">
                  <h2 className="text-xl font-bold mb-2">Publish Course</h2>
                  <p className="text-sm text-gray-400 mb-6">Add course details and curriculum lessons with optional PDFs.</p>

                  {courseError && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">{courseError}</div>
                  )}
                  
                  <form onSubmit={handleAddCourse} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Course Title</label>
                        <input
                          type="text"
                          value={courseForm.title}
                          onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                          placeholder="Course title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Learning Objective</label>
                        <input
                          type="text"
                          value={courseForm.learning_objective}
                          onChange={(e) => setCourseForm({ ...courseForm, learning_objective: e.target.value })}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                          placeholder="At the end of this course you should learn how to..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        required
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                        placeholder="What this course covers"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Curriculum</h3>
                        <button
                          type="button"
                          onClick={addCurriculumItem}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
                        >
                          Add Lesson
                        </button>
                      </div>

                      {courseForm.curriculum.map((item, index) => (
                        <div key={index} className="glass rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Lesson {index + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeCurriculumItem(index)}
                              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-300 mb-1">Subheading</label>
                              <input
                                type="text"
                                value={item.subheading}
                                onChange={(e) => updateCurriculumItem(index, 'subheading', e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                                placeholder="Lesson title"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-300 mb-1">Video URL</label>
                              <input
                                type="url"
                                value={item.video_url}
                                onChange={(e) => updateCurriculumItem(index, 'video_url', e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                                placeholder="https://www.youtube.com/watch?v=..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Lesson Description</label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateCurriculumItem(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                              placeholder="What this lesson covers"
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 items-end">
                            <div>
                              <label className="block text-xs text-gray-300 mb-1">PDF URL (optional)</label>
                              <input
                                type="url"
                                value={item.pdf_url}
                                onChange={(e) => updateCurriculumItem(index, 'pdf_url', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                                placeholder="Will auto-fill after upload"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-300 mb-1">Upload PDF to Supabase</label>
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    uploadCurriculumPdf(index, file)
                                  }
                                }}
                                className="block w-full text-sm text-gray-300 file:mr-4 file:px-3 file:py-2 file:border-0 file:rounded-lg file:bg-white/10 file:text-white hover:file:bg-white/20"
                              />
                              {uploadingPdfIndex === index && (
                                <p className="text-xs text-purple-300 mt-1">Uploading PDF...</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Extra Text (optional)</label>
                            <textarea
                              value={item.extra_text}
                              onChange={(e) => updateCurriculumItem(index, 'extra_text', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                              placeholder="Any extra note, assignment, or instruction"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCourse(false)
                          setCourseError('')
                        }}
                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingCourse}
                        className="flex-1 gradient-bg py-3 rounded-xl font-semibold disabled:opacity-50"
                      >
                        {savingCourse ? 'Publishing...' : 'Publish Course'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {courses.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-gray-400">Add your first course to get started.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="glass rounded-2xl overflow-hidden p-5">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-lg">{course.title}</h3>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
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
                        {course.curriculum.map((lesson, index) => (
                          <div key={lesson.id} className="rounded-xl bg-white/5 p-3">
                            <p className="font-semibold text-sm">{index + 1}. {lesson.subheading}</p>
                            {lesson.description && <p className="text-xs text-gray-400 mt-1">{lesson.description}</p>}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <a
                                href={lesson.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
                              >
                                Video
                              </a>
                              {lesson.pdf_url && (
                                <a
                                  href={lesson.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium"
                                >
                                  PDF
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}

            {activeTab === 'admins' && (
              <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Admin Accounts</h2>
                <p className="text-gray-400 text-sm mt-1">Create and manage admin access</p>
              </div>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="gradient-bg px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Admin
              </button>
            </div>

            {showAddAdmin && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="glass rounded-2xl p-8 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-6">Create New Admin</h3>

                  {adminError && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                      <p className="text-red-300 text-sm">{adminError}</p>
                    </div>
                  )}

                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                        placeholder="Admin Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                        placeholder="newadmin@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input
                        type="password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                        placeholder="Minimum 8 characters"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAdmin(false)
                          setAdminError('')
                        }}
                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAdmin}
                        className="flex-1 gradient-bg py-3 rounded-xl font-semibold disabled:opacity-50"
                      >
                        {savingAdmin ? 'Creating...' : 'Create Admin'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Added On</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          No admins found
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium">{admin.name}</td>
                          <td className="px-6 py-4 text-purple-300">{admin.email}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {admin.id === 'bootstrap-admin'
                              ? 'Configured via Vercel ENV'
                              : new Date(admin.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              admin.email === currentAdminEmail
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {admin.email === currentAdminEmail ? 'Current Session' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
