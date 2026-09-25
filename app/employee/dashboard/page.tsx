'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Header } from '@/app/components/Header'
import { Sidebar } from '@/app/components/Sidebar'

type AttendanceRecord = {
  id: string
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
}

type LeaveRecord = {
  id: string
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export default function EmployeeDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const fetchData = useCallback(async () => {
    const [attendanceResponse, leaveResponse] = await Promise.all([
      fetch('/api/attendance'),
      fetch('/api/leave'),
    ])
    const attendanceData = await attendanceResponse.json()
    const leaveData = await leaveResponse.json()

    if (!attendanceResponse.ok || !leaveResponse.ok) {
      throw new Error(attendanceData.error || leaveData.error || 'Unable to load dashboard data')
    }

    setAttendance(attendanceData.attendance || [])
    setTodayRecord(attendanceData.todayRecord || null)
    setLeaves(leaveData || [])
  }, [])

  useEffect(() => {
    Promise.resolve()
      .then(fetchData)
      .catch((loadError: Error) => setError(loadError.message))
  }, [fetchData])

  const handleAttendance = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update attendance')
      await fetchData()
      toast.success(action === 'CHECK_IN' ? 'Successfully checked in for today!' : 'Successfully checked out for today!')
    } catch (attendanceError) {
      const message = attendanceError instanceof Error ? attendanceError.message : 'Unable to update attendance'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to submit leave request')
      setStartDate('')
      setEndDate('')
      setReason('')
      await fetchData()
      toast.success('Leave request submitted successfully!')
    } catch (leaveError) {
      const message = leaveError instanceof Error ? leaveError.message : 'Unable to submit leave request'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const calculateHoursWorked = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return null
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Header title="Employee Portal" />

        {error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div id="attendance" className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Attendance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Status: <span className="font-semibold text-blue-600">{todayRecord ? todayRecord.status : 'Not Checked In'}</span>
              {todayRecord?.checkIn && todayRecord?.checkOut && (
                <span className="ml-3 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Duration: {calculateHoursWorked(todayRecord.checkIn, todayRecord.checkOut)}
                </span>
              )}
            </p>
            <div className="flex space-x-4">
              <button
                disabled={loading || !!todayRecord}
                onClick={() => handleAttendance('CHECK_IN')}
                className="flex-1 rounded-lg bg-green-600 py-2.5 font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                Check In
              </button>
              <button
                disabled={loading || !todayRecord || !!todayRecord.checkOut}
                onClick={() => handleAttendance('CHECK_OUT')}
                className="flex-1 rounded-lg bg-amber-600 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                Check Out
              </button>
            </div>
          </div>

          <div id="leaves" className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700"><p className="text-xs font-semibold uppercase text-gray-500">Total Requested</p><p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">{leaves.length}</p></div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700"><p className="text-xs font-semibold uppercase text-gray-500">Approved</p><p className="mt-1 text-2xl font-extrabold text-green-600">{leaves.filter((leave) => leave.status === 'APPROVED').length}</p></div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700"><p className="text-xs font-semibold uppercase text-gray-500">Pending</p><p className="mt-1 text-2xl font-extrabold text-amber-500">{leaves.filter((leave) => leave.status === 'PENDING').length}</p></div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700"><p className="text-xs font-semibold uppercase text-gray-500">Rejected</p><p className="mt-1 text-2xl font-extrabold text-red-600">{leaves.filter((leave) => leave.status === 'REJECTED').length}</p></div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">
                  Start Date
                  <input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </label>
                <label className="text-xs text-gray-500">
                  End Date
                  <input type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </label>
              </div>
              <input type="text" placeholder="Reason for leave" required value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-lg border p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                Submit Leave Request
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Attendance History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase dark:bg-gray-700"><tr><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Check In</th><th className="p-3">Check Out</th></tr></thead>
              <tbody>
                {attendance.map((record) => <tr key={record.id} className="border-b dark:border-gray-700"><td className="p-3">{new Date(record.date).toLocaleDateString()}</td><td className="p-3">{record.status}</td><td className="p-3">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td><td className="p-3">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td></tr>)}
                {attendance.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">No attendance records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">My Leave History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase dark:bg-gray-700"><tr><th className="p-3">Dates</th><th className="p-3">Reason</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {leaves.map((leave) => <tr key={leave.id} className="border-b dark:border-gray-700"><td className="p-3">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td><td className="p-3">{leave.reason}</td><td className="p-3"><span className={`rounded px-2 py-1 text-xs font-semibold ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' : leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{leave.status}</span></td></tr>)}
                {leaves.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">No leave applications found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </main>
    </div>
  )
}