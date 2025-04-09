import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ArrowDownUp, Users, PawPrint, MessageSquare, PieChart, Briefcase, Shield, User, Edit, Trash2, AlertTriangle, Eye, Pencil, Heart, Check } from "lucide-react";
import { getInitials, getRandomPetImage } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User as UserType, Pet } from "@shared/schema";

interface AdminStats {
  usersCount: number;
  petsCount: number;
  conversationsCount: number;
  messagesCount: number;
}

interface UpdateRoleParams {
  userId: number;
  role: "user" | "owner" | "admin";
  isAdmin: boolean;
}

interface ToggleAdoptionParams {
  petId: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<"user" | "owner" | "admin">("user");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      window.location.href = "/";
    }
  }, [user]);

  // Query for system stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  // Query for all users
  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });
  
  // Query for all pets
  const { data: petsData, isLoading: petsLoading } = useQuery<{
    pets: Pet[];
    totalCount: number;
    totalPages: number;
  }>({
    queryKey: ["/api/admin/pets"],
    enabled: !!user?.isAdmin,
  });

  // Mutation for updating user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, isAdmin }: UpdateRoleParams) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role, isAdmin });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User role updated",
        description: "The user's role has been successfully updated.",
      });
      setRoleDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleUpdate = () => {
    if (!selectedUser) return;
    
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole,
      isAdmin,
    });
  };

  const openRoleDialog = (user: UserType) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsAdmin(user.isAdmin);
    setRoleDialog(true);
  };
  
  // Mutation for toggling pet adoption status
  const toggleAdoptionMutation = useMutation({
    mutationFn: async ({ petId }: ToggleAdoptionParams) => {
      const res = await apiRequest("PATCH", `/api/admin/pets/${petId}/toggle-adoption`, {});
      return await res.json();
    },
    onSuccess: (updatedPet) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pets"] });
      toast({
        title: updatedPet.adopted ? "Pet marked as adopted" : "Pet marked as available",
        description: `${updatedPet.name} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update pet status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a pet
  const deletePetMutation = useMutation({
    mutationFn: async (petId: number) => {
      await apiRequest("DELETE", `/api/admin/pets/${petId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Pet deleted",
        description: "The pet has been successfully deleted.",
      });
      setDeleteConfirmDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete pet",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const openDeleteConfirmDialog = (pet: Pet) => {
    setSelectedPet(pet);
    setDeleteConfirmDialog(true);
  };
  
  const handleDeletePet = () => {
    if (!selectedPet) return;
    deletePetMutation.mutate(selectedPet.id);
  };
  
  const handleToggleAdoption = (pet: Pet) => {
    toggleAdoptionMutation.mutate({ petId: pet.id });
  };

  if (!user?.isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Restricted Area</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, view stats, and monitor system activity</p>
      </header>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="pets" className="flex items-center gap-2">
            <PawPrint className="h-4 w-4" />
            <span>Pets</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.usersCount || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pets Listed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-primary" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.petsCount || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.conversationsCount || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.messagesCount || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border rounded-md">
                  <p className="text-muted-foreground">Chart coming soon</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Popular Pet Types</CardTitle>
                <CardDescription>Distribution of pet types in the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border rounded-md">
                  <p className="text-muted-foreground">Chart coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Role <ArrowDownUp className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : (
                      users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.role === "admin" ? (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </Badge>
                              ) : user.role === "owner" ? (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  Owner
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  User
                                </Badge>
                              )}
                              {user.isAdmin && !user.role.includes("admin") && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openRoleDialog(user)}
                            >
                              Change Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pets Tab */}
        <TabsContent value="pets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pet Management</CardTitle>
              <CardDescription>View and manage all pets in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {petsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading pets...
                        </TableCell>
                      </TableRow>
                    ) : (
                      petsData?.pets.map((pet) => (
                        <TableRow key={pet.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md overflow-hidden">
                                <img 
                                  src={pet.mainImage || getRandomPetImage(pet.petType)} 
                                  alt={pet.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{pet.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {pet.breed}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {pet.petType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{pet.location}</TableCell>
                          <TableCell>{new Date(pet.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {pet.adopted ? "Adopted" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.open(`/pets/${pet.id}`, '_blank')}
                                title="View pet"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.open(`/pets/${pet.id}/edit`, '_blank')}
                                title="Edit pet"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={pet.adopted ? "secondary" : "default"}
                                size="icon"
                                onClick={() => handleToggleAdoption(pet)}
                                title={pet.adopted ? "Mark as available" : "Mark as adopted"}
                              >
                                {pet.adopted ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => openDeleteConfirmDialog(pet)}
                                title="Delete pet"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Log</CardTitle>
              <CardDescription>Recent actions and events in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  Activity logging coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Change Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role and permissions for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select 
                value={newRole} 
                onValueChange={(value) => setNewRole(value as "user" | "owner" | "admin")}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="owner">Pet Owner</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="admin-rights" 
                checked={isAdmin} 
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              <Label htmlFor="admin-rights">Grant admin privileges</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRoleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleUpdate}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pet Confirmation Dialog */}
      <AlertDialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold">{selectedPet?.name}</span> and remove the data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePetMutation.isPending}
            >
              {deletePetMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}