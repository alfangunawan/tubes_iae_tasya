'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, Trash2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Booking {
    id: string
    userName: string
    userEmail: string
    storeName: string
    serviceLabel: string
    weight: number
    totalPrice: number
    status: string
    checkInDate: string
    createdAt: string
}

interface Store {
    id: string
    name: string
    services: { type: string; label: string; price: number }[]
}

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED']

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [stores, setStores] = useState<Store[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        storeId: '',
        serviceType: '',
        weight: 1,
        checkInDate: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchBookings()
        fetchStores()
    }, [])

    const fetchStores = async () => {
        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { stores { id name services { type label price } } }`
                })
            })
            const { data } = await res.json()
            setStores(data?.stores || [])
        } catch (err) {
            console.error('Failed to fetch stores')
        }
    }

    const fetchBookings = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        query {
                            bookings {
                                id userName userEmail storeName serviceLabel
                                weight totalPrice status checkInDate createdAt
                            }
                        }
                    `
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)
            setBookings(data.bookings || [])
        } catch (err: any) {
            toast.error('Failed to fetch bookings: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const createBooking = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        if (!formData.storeId || !formData.serviceType) {
            toast.warning('Please fill all required fields')
            return
        }

        try {
            const userInfo = JSON.parse(atob(token.split('.')[1]))
            const selectedStore = stores.find(s => s.id === formData.storeId)
            const selectedService = selectedStore?.services.find(s => s.type === formData.serviceType)

            if (!selectedStore || !selectedService) {
                toast.error('Invalid store or service')
                return
            }

            const res = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        mutation CreateBooking($input: CreateBookingInput!) {
                            createBooking(input: $input) { id }
                        }
                    `,
                    variables: {
                        input: {
                            userId: userInfo.id,
                            userName: userInfo.name,
                            userEmail: userInfo.email,
                            storeId: formData.storeId,
                            storeName: selectedStore.name,
                            serviceType: formData.serviceType,
                            serviceLabel: selectedService.label,
                            weight: formData.weight,
                            pricePerKg: selectedService.price,
                            checkInDate: formData.checkInDate
                        }
                    }
                })
            })

            const { errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success('Booking created successfully')
            setDialogOpen(false)
            setFormData({ storeId: '', serviceType: '', weight: 1, checkInDate: new Date().toISOString().split('T')[0] })
            fetchBookings()
        } catch (err: any) {
            toast.error('Failed to create booking: ' + err.message)
        }
    }

    const updateStatus = async (bookingId: string, newStatus: string) => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateBookingStatus($input: UpdateBookingStatusInput!) {
                            updateBookingStatus(input: $input) { id status }
                        }
                    `,
                    variables: { input: { id: bookingId, status: newStatus } }
                })
            })

            const { errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success(`Status updated to ${newStatus}`)
            fetchBookings()
        } catch (err: any) {
            toast.error('Failed to update status: ' + err.message)
        }
    }

    const cancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return

        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `mutation CancelBooking($id: ID!) { cancelBooking(id: $id) { id status } }`,
                    variables: { id: bookingId }
                })
            })

            const { errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success('Booking cancelled')
            fetchBookings()
        } catch (err: any) {
            toast.error('Failed to cancel booking: ' + err.message)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-700',
            CONFIRMED: 'bg-blue-100 text-blue-700',
            PROCESSING: 'bg-purple-100 text-purple-700',
            READY: 'bg-green-100 text-green-700',
            COMPLETED: 'bg-gray-100 text-gray-700',
            CANCELLED: 'bg-red-100 text-red-700',
        }
        return variants[status] || 'bg-gray-100 text-gray-700'
    }

    const selectedStore = stores.find(s => s.id === formData.storeId)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF385C]"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Bookings</h1>
                    <p className="text-gray-500">Manage all laundry bookings</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchBookings} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#FF385C] hover:bg-[#E31C5F]">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Booking
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Booking</DialogTitle>
                                <DialogDescription>Create a booking for a customer</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Store *</Label>
                                    <Select value={formData.storeId} onValueChange={(v) => setFormData({ ...formData, storeId: v, serviceType: '' })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select store" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedStore && (
                                    <div className="space-y-2">
                                        <Label>Service *</Label>
                                        <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select service" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedStore.services.map((service) => (
                                                    <SelectItem key={service.type} value={service.type}>
                                                        {service.label} - Rp {service.price.toLocaleString()}/kg
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Weight (kg) *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Check-in Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.checkInDate}
                                        onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                                    />
                                </div>
                                <Button onClick={createBooking} className="w-full bg-[#FF385C] hover:bg-[#E31C5F]">
                                    Create Booking
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Bookings</CardTitle>
                    <CardDescription>{bookings.length} total bookings</CardDescription>
                </CardHeader>
                <CardContent>
                    {bookings.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No bookings found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{booking.userName}</p>
                                                <p className="text-sm text-gray-500">{booking.userEmail}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{booking.storeName}</TableCell>
                                        <TableCell>{booking.serviceLabel}</TableCell>
                                        <TableCell>{booking.weight} kg</TableCell>
                                        <TableCell>Rp {booking.totalPrice.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={booking.status}
                                                onValueChange={(value) => updateStatus(booking.id, value)}
                                                disabled={booking.status === 'CANCELLED'}
                                            >
                                                <SelectTrigger className={`w-32 ${getStatusBadge(booking.status)} border-0`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUSES.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => cancelBooking(booking.id)}
                                                disabled={booking.status === 'CANCELLED'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
