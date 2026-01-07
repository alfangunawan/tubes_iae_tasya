'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, CreditCard, Store, Users, TrendingUp, Package } from "lucide-react"
import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts'

interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  totalPayments: number
  totalRevenue: number
  totalStores: number
  totalUsers: number
}

interface ChartData {
  revenueData: { date: string; revenue: number }[]
  paymentStatusData: { name: string; value: number; color: string }[]
  bookingStatusData: { status: string; count: number }[]
}

const COLORS = ['#FFBB28', '#00C49F', '#FF8042', '#8884d8', '#82ca9d']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    totalPayments: 0,
    totalRevenue: 0,
    totalStores: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [chartData, setChartData] = useState<ChartData>({
    revenueData: [],
    paymentStatusData: [],
    bookingStatusData: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Fetch bookings
      const bookingsRes = await fetch('http://localhost:3000/graphql-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `query { bookings { id storeName status totalPrice createdAt } }`
        })
      })
      const bookingsData = await bookingsRes.json()
      const bookings = bookingsData.data?.bookings || []

      // Fetch payments
      const paymentsRes = await fetch('http://localhost:3000/graphql-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `query { payments { id amount status createdAt } }`
        })
      })
      const paymentsData = await paymentsRes.json()
      const payments = paymentsData.data?.payments || []

      // Fetch stores
      const storesRes = await fetch('http://localhost:3000/graphql-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { stores { id } }`
        })
      })
      const storesData = await storesRes.json()
      const stores = storesData.data?.stores || []

      // Calculate stats
      const paidPayments = payments.filter((p: any) => p.status === 'PAID')
      const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
      const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING').length

      setStats({
        totalBookings: bookings.length,
        pendingBookings,
        totalPayments: payments.length,
        totalRevenue,
        totalStores: stores.length,
        totalUsers: 2 // Default users
      })

      setRecentBookings(bookings.slice(0, 5))

      // Process chart data
      // Revenue by date (last 7 days)
      const revenueByDate: Record<string, number> = {}
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        revenueByDate[dateStr] = 0
      }

      paidPayments.forEach((p: any) => {
        const pDate = new Date(p.createdAt)
        if (!isNaN(pDate.getTime())) {
          const dateStr = pDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
          if (revenueByDate[dateStr] !== undefined) {
            revenueByDate[dateStr] += p.amount
          }
        }
      })

      const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue
      }))

      // Payment status distribution
      const statusCounts: Record<string, number> = { PENDING: 0, PAID: 0, REFUNDED: 0, FAILED: 0 }
      payments.forEach((p: any) => {
        if (statusCounts[p.status] !== undefined) {
          statusCounts[p.status]++
        }
      })

      const paymentStatusData = [
        { name: 'Pending', value: statusCounts.PENDING, color: '#FFBB28' },
        { name: 'Paid', value: statusCounts.PAID, color: '#00C49F' },
        { name: 'Refunded', value: statusCounts.REFUNDED, color: '#8884d8' },
        { name: 'Failed', value: statusCounts.FAILED, color: '#FF8042' }
      ].filter(item => item.value > 0)

      // Booking status counts
      const bookingStatusCounts: Record<string, number> = {}
      bookings.forEach((b: any) => {
        bookingStatusCounts[b.status] = (bookingStatusCounts[b.status] || 0) + 1
      })

      const bookingStatusData = Object.entries(bookingStatusCounts).map(([status, count]) => ({
        status,
        count
      }))

      setChartData({
        revenueData,
        paymentStatusData,
        bookingStatusData
      })

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      description: `${stats.pendingBookings} pending`,
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Total Payments',
      value: stats.totalPayments,
      description: 'All transactions',
      icon: CreditCard,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: `Rp ${stats.totalRevenue.toLocaleString()}`,
      description: 'From paid orders',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Active Stores',
      value: stats.totalStores,
      description: 'Partner laundries',
      icon: Store,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-pink-600',
      bg: 'bg-pink-50'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF385C]"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to Smart Laundry Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF385C"
                    strokeWidth={2}
                    dot={{ fill: '#FF385C', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {chartData.paymentStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No payment data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Status</CardTitle>
          <CardDescription>Count of bookings per status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {chartData.bookingStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.bookingStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {chartData.bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No booking data
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest booking orders from customers</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Package className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.storeName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rp {booking.totalPrice?.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
