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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RefreshCw, RotateCcw, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Payment {
    id: string
    bookingId: string
    userName: string
    userEmail: string
    storeName: string
    amount: number
    paymentMethod: string
    status: string
    invoiceNumber: string
    paidAt: string
    createdAt: string
}

const PAYMENT_METHODS = ['BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD', 'CASH']

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        bookingId: '',
        userName: '',
        userEmail: '',
        storeName: '',
        amount: 0,
        paymentMethod: 'BANK_TRANSFER'
    })

    useEffect(() => {
        fetchPayments()
    }, [])

    const fetchPayments = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('http://localhost:3000/graphql-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        query {
                            payments {
                                id bookingId userName userEmail storeName
                                amount paymentMethod status invoiceNumber paidAt createdAt
                            }
                        }
                    `
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)
            setPayments(data.payments || [])
        } catch (err: any) {
            toast.error('Failed to fetch payments: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const createPayment = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        if (!formData.userName || !formData.amount) {
            toast.warning('Please fill all required fields')
            return
        }

        try {
            const userInfo = JSON.parse(atob(token.split('.')[1]))

            const res = await fetch('http://localhost:3000/graphql-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        mutation CreatePayment($input: CreatePaymentInput!) {
                            createPayment(input: $input) { id invoiceNumber }
                        }
                    `,
                    variables: {
                        input: {
                            bookingId: formData.bookingId || `manual-${Date.now()}`,
                            userId: userInfo.id,
                            userName: formData.userName,
                            userEmail: formData.userEmail,
                            storeName: formData.storeName,
                            serviceLabel: 'Manual Payment',
                            weight: 1,
                            amount: formData.amount,
                            paymentMethod: formData.paymentMethod
                        }
                    }
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success(`Payment created: ${data.createPayment.invoiceNumber}`)
            setDialogOpen(false)
            setFormData({ bookingId: '', userName: '', userEmail: '', storeName: '', amount: 0, paymentMethod: 'BANK_TRANSFER' })
            fetchPayments()
        } catch (err: any) {
            toast.error('Failed to create payment: ' + err.message)
        }
    }

    const refundPayment = async (paymentId: string) => {
        const reason = prompt('Enter refund reason:')
        if (!reason) return

        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('http://localhost:3000/graphql-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        mutation RefundPayment($input: RefundPaymentInput!) {
                            refundPayment(input: $input) { id status }
                        }
                    `,
                    variables: { input: { paymentId, reason } }
                })
            })

            const { errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success('Payment refunded successfully')
            fetchPayments()
        } catch (err: any) {
            toast.error('Failed to refund payment: ' + err.message)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-700',
            PAID: 'bg-green-100 text-green-700',
            FAILED: 'bg-red-100 text-red-700',
            REFUNDED: 'bg-purple-100 text-purple-700',
            EXPIRED: 'bg-gray-100 text-gray-700',
        }
        return variants[status] || 'bg-gray-100 text-gray-700'
    }

    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            BANK_TRANSFER: 'Bank Transfer',
            E_WALLET: 'E-Wallet',
            CREDIT_CARD: 'Credit Card',
            CASH: 'Cash',
        }
        return labels[method] || method
    }

    const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length
    const refundedAmount = payments.filter(p => p.status === 'REFUNDED').reduce((sum, p) => sum + p.amount, 0)

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
                    <h1 className="text-2xl font-bold">Payments</h1>
                    <p className="text-gray-500">Manage all payment transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchPayments} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#FF385C] hover:bg-[#E31C5F]">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Manual Payment</DialogTitle>
                                <DialogDescription>Record a manual payment transaction</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Customer Name *</Label>
                                    <Input
                                        value={formData.userName}
                                        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                        placeholder="Customer name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Customer Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.userEmail}
                                        onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                                        placeholder="customer@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Store Name</Label>
                                    <Input
                                        value={formData.storeName}
                                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                        placeholder="Store name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount (Rp) *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((method) => (
                                                <SelectItem key={method} value={method}>{getMethodLabel(method)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={createPayment} className="w-full bg-[#FF385C] hover:bg-[#E31C5F]">
                                    Create Payment
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Rp {totalRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Refunded Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">Rp {refundedAmount.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Payments</CardTitle>
                    <CardDescription>{payments.length} total transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No payments found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-mono text-sm">{payment.invoiceNumber}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{payment.userName}</p>
                                                <p className="text-sm text-gray-500">{payment.userEmail}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{payment.storeName}</TableCell>
                                        <TableCell className="font-medium">Rp {payment.amount.toLocaleString()}</TableCell>
                                        <TableCell>{getMethodLabel(payment.paymentMethod)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {payment.status === 'PAID' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-purple-600"
                                                    onClick={() => refundPayment(payment.id)}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Refund
                                                </Button>
                                            )}
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
