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
import { RefreshCw, Shield, User, Plus } from "lucide-react"
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
    const [dialogOpen, setDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
        phone: ''
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            setLoading(false)
            return
        }

        try {
            const res = await fetch('http://localhost:3000/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
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

    const createUser = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast.warning('Please fill all required fields')
            return
        }

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create user')
            }

            toast.success('User created successfully')
            setDialogOpen(false)
            setFormData({ name: '', email: '', password: '', role: 'CUSTOMER', phone: '' })

            // Add to local state
            setUsers([...users, {
                id: data.user?.id || String(Date.now()),
                name: formData.name,
                email: formData.email,
                role: formData.role,
                phone: formData.phone,
                createdAt: new Date().toISOString()
            }])
        } catch (err: any) {
            toast.error('Failed to create user: ' + err.message)
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
                <div className="flex gap-2">
                    <Button onClick={fetchUsers} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#FF385C] hover:bg-[#E31C5F]">
                                <Plus className="h-4 w-4 mr-2" />
                                Create User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>Register a new user account</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password *</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="081234567890"
                                    />
                                </div>
                                <Button onClick={createUser} className="w-full bg-[#FF385C] hover:bg-[#E31C5F]">
                                    Create User
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
