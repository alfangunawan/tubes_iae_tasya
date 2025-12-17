'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { RefreshCw, RotateCcw } from "lucide-react"
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

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

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
                id
                bookingId
                userName
                userEmail
                storeName
                amount
                paymentMethod
                status
                invoiceNumber
                paidAt
                createdAt
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
              refundPayment(input: $input) {
                id
                status
              }
            }
          `,
                    variables: {
                        input: { paymentId, reason }
                    }
                })
            })

            const { data, errors } = await res.json()
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

    // Calculate stats
    const totalRevenue = payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0)
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length
    const refundedAmount = payments
        .filter(p => p.status === 'REFUNDED')
        .reduce((sum, p) => sum + p.amount, 0)

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
                <Button onClick={fetchPayments} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
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
