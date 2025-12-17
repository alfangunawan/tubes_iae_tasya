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
import { RefreshCw, Plus, Star, Trash2, Edit } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Store {
    id: string
    name: string
    description: string
    address: string
    rating: number
    reviewCount: number
    createdAt: string
}

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: ''
    })

    useEffect(() => {
        fetchStores()
    }, [])

    const fetchStores = async () => {
        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
            query {
              stores {
                id
                name
                description
                address
                rating
                reviewCount
                createdAt
              }
            }
          `
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)
            setStores(data.stores || [])
        } catch (err: any) {
            toast.error('Failed to fetch stores: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const createStore = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        if (!formData.name || !formData.address) {
            toast.warning('Please fill in required fields')
            return
        }

        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
            mutation CreateStore($input: CreateStoreInput!) {
              createStore(input: $input) {
                id
                name
              }
            }
          `,
                    variables: {
                        input: {
                            name: formData.name,
                            description: formData.description,
                            address: formData.address,
                            ownerId: 'admin',
                            services: [
                                { type: 'regular', price: 7000, label: 'Regular Wash' },
                                { type: 'express', price: 12000, label: 'Express Wash' }
                            ]
                        }
                    }
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success('Store created successfully')
            setDialogOpen(false)
            setFormData({ name: '', description: '', address: '' })
            fetchStores()
        } catch (err: any) {
            toast.error('Failed to create store: ' + err.message)
        }
    }

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
                    <h1 className="text-2xl font-bold">Stores</h1>
                    <p className="text-gray-500">Manage laundry partner stores</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchStores} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#FF385C] hover:bg-[#E31C5F]">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Store
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Store</DialogTitle>
                                <DialogDescription>Create a new laundry partner store</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Store Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Clean & Fresh Laundry"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the store"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full store address"
                                    />
                                </div>
                                <Button onClick={createStore} className="w-full bg-[#FF385C] hover:bg-[#E31C5F]">
                                    Create Store
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Stores</CardTitle>
                    <CardDescription>{stores.length} partner stores</CardDescription>
                </CardHeader>
                <CardContent>
                    {stores.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No stores found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Store Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Reviews</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stores.map((store) => (
                                    <TableRow key={store.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{store.name}</p>
                                                <p className="text-sm text-gray-500 truncate max-w-xs">{store.description}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{store.address}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span>{store.rating?.toFixed(1) || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{store.reviewCount || 0}</TableCell>
                                        <TableCell>
                                            {new Date(store.createdAt).toLocaleDateString()}
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
