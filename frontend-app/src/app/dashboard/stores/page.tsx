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
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedStore, setSelectedStore] = useState<Store | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: ''
    })
    const [editFormData, setEditFormData] = useState({
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

    const openEditDialog = (store: Store) => {
        setSelectedStore(store)
        setEditFormData({
            name: store.name,
            description: store.description,
            address: store.address
        })
        setEditDialogOpen(true)
    }

    const updateStore = async () => {
        if (!selectedStore) return

        const token = localStorage.getItem('token')
        if (!token) return

        if (!editFormData.name || !editFormData.address) {
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
                        mutation UpdateStore($id: ID!, $input: UpdateStoreInput!) {
                            updateStore(id: $id, input: $input) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        id: selectedStore.id,
                        input: {
                            name: editFormData.name,
                            description: editFormData.description,
                            address: editFormData.address
                        }
                    }
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success('Store updated successfully')
            setEditDialogOpen(false)
            setSelectedStore(null)
            fetchStores()
        } catch (err: any) {
            toast.error('Failed to update store: ' + err.message)
        }
    }

    const openDeleteDialog = (store: Store) => {
        setSelectedStore(store)
        setDeleteDialogOpen(true)
    }

    const deleteStore = async () => {
        if (!selectedStore) return

        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: `
                        mutation DeleteStore($id: ID!) {
                            deleteStore(id: $id)
                        }
                    `,
                    variables: {
                        id: selectedStore.id
                    }
                })
            })

            const { data, errors } = await res.json()
            if (errors) throw new Error(errors[0].message)

            toast.success('Store deleted successfully')
            setDeleteDialogOpen(false)
            setSelectedStore(null)
            fetchStores()
        } catch (err: any) {
            toast.error('Failed to delete store: ' + err.message)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '-'
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
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
                                    <TableHead>Actions</TableHead>
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
                                            {formatDate(store.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => openEditDialog(store)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => openDeleteDialog(store)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Store Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Store</DialogTitle>
                        <DialogDescription>Update store information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Store Name *</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                placeholder="e.g. Clean & Fresh Laundry"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                placeholder="Brief description of the store"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Address *</Label>
                            <Input
                                id="edit-address"
                                value={editFormData.address}
                                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                placeholder="Full store address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={updateStore} className="bg-[#FF385C] hover:bg-[#E31C5F]">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Store</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{selectedStore?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteStore}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
