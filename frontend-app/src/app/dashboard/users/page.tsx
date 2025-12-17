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
import { RefreshCw, Shield, User } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface UserData {
    id: string
    name: string
    email: string
    role: string
    phone: string
    createdAt: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            // Note: In a real app, you'd have a proper users list endpoint
            // For demo, we'll show the current logged-in user + hardcoded users
            const res = await fetch('http://localhost:3000/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const currentUser = await res.json()

            // Demo users - in production, this would be fetched from the API
            const demoUsers: UserData[] = [
                {
                    id: '1',
                    name: 'Admin Laundry',
                    email: 'admin@smartlaundry.com',
                    role: 'admin',
                    phone: '081234567890',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Customer Demo',
                    email: 'customer@smartlaundry.com',
                    role: 'CUSTOMER',
                    phone: '089876543210',
                    createdAt: new Date().toISOString()
                }
            ]

            // Add current user if not already in the list
            if (currentUser && !demoUsers.find(u => u.email === currentUser.email)) {
                demoUsers.push({
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    role: currentUser.role,
                    phone: currentUser.phone || '',
                    createdAt: currentUser.createdAt || new Date().toISOString()
                })
            }

            setUsers(demoUsers)
        } catch (err: any) {
            toast.error('Failed to fetch users')
            // Fallback to demo users
            setUsers([
                {
                    id: '1',
                    name: 'Admin Laundry',
                    email: 'admin@smartlaundry.com',
                    role: 'admin',
                    phone: '081234567890',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Customer Demo',
                    email: 'customer@smartlaundry.com',
                    role: 'CUSTOMER',
                    phone: '089876543210',
                    createdAt: new Date().toISOString()
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role: string) => {
        if (role === 'admin') {
            return 'bg-red-100 text-red-700'
        } else if (role === 'staff') {
            return 'bg-blue-100 text-blue-700'
        }
        return 'bg-gray-100 text-gray-700'
    }

    const adminCount = users.filter(u => u.role === 'admin').length
    const customerCount = users.filter(u => u.role === 'CUSTOMER').length

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
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-gray-500">Manage system users</p>
                </div>
                <Button onClick={fetchUsers} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{adminCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{customerCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>{users.length} registered users</CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No users found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                    {user.role === 'admin' ? (
                                                        <Shield className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <User className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Customer'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
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
