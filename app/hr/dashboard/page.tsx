'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { HRAssistantModal } from '@/app/components/HRAssistantModal'
import { Sidebar } from '@/app/components/Sidebar'
import { ThemeToggle } from '@/app/components/ThemeToggle'

type LeaveRecord = {
  id: string
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  user?: { name: string; email: string; department: string | null }
}

type AttendanceRecord = {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  user?: { name: string; email: string; department: string | null }
}

function statusClasses(status: LeaveRecord['status']) {
  if (status === 'APPROVED') return 'bg-green-100 text-green-700'
  if (status === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-yellow-100 text-yellow-700'
}

export default function HRDashboard() {
  const { data: session } = useSession()
  const isHR = (session?.user as { role?: string } | undefined)?.role === 'HR'
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [leaveSearch, setLeaveSearch] = useState('')
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('Password123!')
  const [newDept, setNewDept] = useState('Engineering')
  const [newRole, setNewRole] = useState('EMPLOYEE')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    const [leaveResponse, attendanceResponse] = await Promise.all([
      fetch('/api/hr/leaves'),
      fetch('/api/hr/attendance'),
    ])
    const leaveData = await leaveResponse.json()
    const attendanceData = await attendanceResponse.json()

    if (!leaveResponse.ok || !attendanceResponse.ok) {
      throw new Error(leaveData.error || attendanceData.error || 'Unable to load HR data')
    }

    setLeaves(leaveData || [])
    setAttendance(attendanceData || [])
  }, [])

  const handleAddEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/hr/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          department: newDept,
          role: newRole,
        }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to add employee')

      toast.success(`Employee ${newName} created successfully!`)
      setShowAddModal(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('Password123!')
      setNewDept('Engineering')
      setNewRole('EMPLOYEE')
      await fetchData()
    } catch (addError) {
      const message = addError instanceof Error ? addError.message : 'Failed to add employee'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    Promise.resolve()
      .then(fetchData)
      .catch((loadError: Error) => setError(loadError.message))
  }, [fetchData])

  const handleUpdateStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/hr/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update leave status')
      await fetchData()
      toast.success(`Leave application ${status.toLowerCase()}!`)
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update leave status'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const exportAttendanceCSV = () => {
    if (!attendance.length) {
      toast.error('No attendance records to export.')
      return
    }

    const escapeCSV = (value: string) => `"${value.replaceAll('"', '""')}"`
    const headers = ['Employee Name', 'Date', 'Check In', 'Check Out', 'Status']
    const rows = attendance.map((record) => [
      record.user?.name || 'N/A',
      new Date(record.date).toLocaleDateString(),
      record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-',
      record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
      record.status,
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n')
    const link = document.createElement('a')
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    link.download = `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Attendance report exported.')
  }

  const exportLeavesCSV = () => {
    if (!leaves.length) {
      toast.error('No leave requests to export.')
      return
    }

    const escapeCSV = (value: string) => `"${value.replaceAll('"', '""')}"`
    const headers = ['Employee Name', 'Department', 'Start Date', 'End Date', 'Reason', 'Status']
    const rows = leaves.map((leave) => [
      leave.user?.name || 'N/A',
      leave.user?.department || 'N/A',
      new Date(leave.startDate).toLocaleDateString(),
      new Date(leave.endDate).toLocaleDateString(),
      leave.reason,
      leave.status,
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n')
    const link = document.createElement('a')
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    link.download = `Leave_Requests_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Leave requests exported.')
  }

  const filteredAttendance = attendance.filter((record) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = record.user?.name?.toLowerCase().includes(query) || record.user?.email?.toLowerCase().includes(query)
    const matchesDept = departmentFilter === 'ALL' || record.user?.department === departmentFilter
    return matchesSearch && matchesDept
  })

  const filteredLeaves = leaves.filter((leave) => {
    const query = leaveSearch.toLowerCase()
    const matchesSearch =
      leave.user?.name?.toLowerCase().includes(query) ||
      leave.user?.email?.toLowerCase().includes(query) ||
      leave.reason?.toLowerCase().includes(query)
    const matchesStatus = leaveStatusFilter === 'ALL' || leave.status === leaveStatusFilter
    return matchesSearch && matchesStatus
  })

  const getFormattedDuration = (checkIn?: string | null, checkOut?: string | null) => {
    if (!checkIn) return '-'
    if (!checkOut) return <span className="text-xs font-medium text-amber-500">In Progress</span>

    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${hours >= 8 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
        {hours}h {minutes}m
      </span>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">HR Executive Center</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real-time workforce monitoring and approvals</p>
          </div>
          <div className="flex items-center gap-3">
            {isHR && (
              <button type="button" onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                + Add Employee
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}

        <HRAssistantModal />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Leaves</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-600">{leaves.filter((leave) => leave.status === 'PENDING').length}</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">Requires Action</span>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today&apos;s Check-ins</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-green-600">{attendance.filter((record) => new Date(record.date).toDateString() === new Date().toDateString()).length}</span>
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600">Present Today</span>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Leave History</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-blue-600">{leaves.length}</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">All Time</span>
            </div>
          </div>
        </div>

        <section id="leaves" className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Requests</h2>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <input type="text" placeholder="Search employee or reason..." value={leaveSearch} onChange={(event) => setLeaveSearch(event.target.value)} className="min-w-52 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <select value={leaveStatusFilter} onChange={(event) => setLeaveStatusFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button onClick={exportLeavesCSV} disabled={!leaves.length} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                Export Leaves CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase dark:bg-gray-700"><tr><th className="p-3">Employee</th><th className="p-3">Dates</th><th className="p-3">Reason</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody>
                {filteredLeaves.map((leave) => <tr key={leave.id} className="border-b dark:border-gray-700"><td className="p-3 font-medium text-gray-900 dark:text-white">{leave.user?.name}<span className="block text-xs text-gray-400">{leave.user?.email}</span></td><td className="p-3">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td><td className="p-3">{leave.reason}</td><td className="p-3"><span className={`rounded px-2 py-1 text-xs font-semibold ${statusClasses(leave.status)}`}>{leave.status}</span></td><td className="space-x-2 p-3 text-right">{leave.status === 'PENDING' && <><button disabled={loading} onClick={() => handleUpdateStatus(leave.id, 'APPROVED')} className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Approve</button><button disabled={loading} onClick={() => handleUpdateStatus(leave.id, 'REJECTED')} className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject</button></>}</td></tr>)}
                {filteredLeaves.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No matching leave requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section id="attendance" className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Attendance Logs</h2>
            <div className="flex w-full gap-2 sm:w-auto">
              <input type="text" placeholder="Search employee..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Management">Management</option>
                <option value="HR">HR</option>
              </select>
              <button onClick={exportAttendanceCSV} disabled={!attendance.length} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase dark:bg-gray-700"><tr><th className="p-3">Employee</th><th className="p-3">Date</th><th className="p-3">Check In</th><th className="p-3">Check Out</th><th className="p-3">Duration</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {filteredAttendance.map((record) => <tr key={record.id} className="border-b dark:border-gray-700"><td className="p-3 font-medium text-gray-900 dark:text-white">{record.user?.name}<span className="block text-xs text-gray-400">{record.user?.department || record.user?.email}</span></td><td className="p-3">{new Date(record.date).toLocaleDateString()}</td><td className="p-3">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td><td className="p-3">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td><td className="p-3">{getFormattedDuration(record.checkIn, record.checkOut)}</td><td className="p-3 font-semibold text-green-600">{record.status}</td></tr>)}
                {filteredAttendance.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No matching attendance records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add New Employee</h3>
              <button type="button" aria-label="Close add employee dialog" onClick={() => setShowAddModal(false)} className="text-sm text-slate-400 hover:text-white">X</button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label htmlFor="new-name" className="text-xs font-semibold text-slate-300">Full Name</label>
                <input id="new-name" type="text" required placeholder="John Doe" value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <div>
                <label htmlFor="new-email" className="text-xs font-semibold text-slate-300">Email Address</label>
                <input id="new-email" type="email" required placeholder="john@zeerostock.com" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <div>
                <label htmlFor="new-password" className="text-xs font-semibold text-slate-300">Default Password</label>
                <input id="new-password" type="text" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-department" className="text-xs font-semibold text-slate-300">Department</label>
                  <select id="new-department" value={newDept} onChange={(event) => setNewDept(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-role" className="text-xs font-semibold text-slate-300">Role</label>
                  <select id="new-role" value={newRole} onChange={(event) => setNewRole(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR">HR Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}