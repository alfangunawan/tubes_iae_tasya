'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, CreditCard, Store, Users, TrendingUp, Package } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  totalPayments: number
  totalRevenue: number
  totalStores: number
  totalUsers: number
}

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
          query: `query { payments { id amount status } }`
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
                        {new Date(booking.createdAt).toLocaleDateString()}
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
