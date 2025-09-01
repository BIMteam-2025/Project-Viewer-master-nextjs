
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, onValue, push, set, remove, update } from 'firebase/database';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, User as UserIcon, PlusCircle, Loader2, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

type RevitUser = {
  [key: string]: any;
  id?: string;
};

export default function AllUsersPage() {
  const [users, setUsers] = useState<RevitUser[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState<RevitUser | null>(null);
  const [editableUser, setEditableUser] = useState<RevitUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUser, setNewUser] = useState<RevitUser>({});
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    const usersRef = ref(db, 'RevitUsers');

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        setIsLoading(true);
        const fetchedUsers: RevitUser[] = [];
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          if (typeof rawData === 'object' && rawData !== null) {
            Object.keys(rawData).forEach((key) => {
               fetchedUsers.push({ ...rawData[key], id: key });
            });
          }
        }
        
        if (fetchedUsers.length > 0) {
          const allHeaders = new Set<string>();
          fetchedUsers.forEach(user => {
            Object.keys(user).forEach(key => {
              if (key !== 'id') {
                allHeaders.add(key);
              }
            });
          });
          setHeaders(Array.from(allHeaders));
          setUsers(fetchedUsers);
        } else {
          setUsers([]);
          setHeaders([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Firebase read for RevitUsers failed:', error);
        toast({
          title: 'Firebase Error',
          description: 'Could not fetch user data from Firebase.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);
  
  const handleFilterChange = (header: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [header]: value,
    }));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const userValue = user[key];
        return String(userValue).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [users, filters]);

  const handleRowClick = (user: RevitUser) => {
    setSelectedUser(user);
    setEditableUser({...user});
    setIsEditing(false);
  }

  const handleNewUserChange = (header: string, value: string) => {
    setNewUser(prev => ({
      ...prev,
      [header]: value,
    }));
  };

  const handleEditableUserChange = (key: string, value: string) => {
    setEditableUser(prev => prev ? ({...prev, [key]: value}) : null);
  };
  
  const handleAddUser = async () => {
    if (Object.values(newUser).every(v => !v)) {
      toast({
        title: 'Cannot Add User',
        description: 'Please fill out at least one field.',
        variant: 'destructive'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const db = getDatabase(app);
      const usersRef = ref(db, 'RevitUsers');
      const newUserRef = push(usersRef);
      await set(newUserRef, newUser);
      
      toast({
        title: 'User Added',
        description: 'The new user has been saved to Firebase.'
      });
      setNewUser({});
      setIsAddUserOpen(false);
    } catch (error) {
       console.error('Failed to add user to Firebase:', error);
       toast({
        title: 'Firebase Error',
        description: 'Could not save the new user. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editableUser || !editableUser.id) return;
    setIsSubmitting(true);
    try {
        const db = getDatabase(app);
        const userRef = ref(db, `RevitUsers/${editableUser.id}`);
        const dataToUpdate = { ...editableUser };
        delete dataToUpdate.id; // Don't save the id as a field
        await update(userRef, dataToUpdate);
        toast({
            title: 'User Updated',
            description: 'The user details have been saved.'
        });
        setIsEditing(false);
        setSelectedUser(editableUser); // Update the view with the new data
    } catch (error) {
        console.error('Failed to update user:', error);
        toast({
            title: 'Firebase Error',
            description: 'Could not update user details. See console for details.',
            variant: 'destructive'
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser.id) return;
    try {
        const db = getDatabase(app);
        const userRef = ref(db, `RevitUsers/${selectedUser.id}`);
        await remove(userRef);
        toast({
            title: 'User Deleted',
            description: `User ${selectedUser['User Name'] || selectedUser.id} has been deleted.`
        });
        setSelectedUser(null);
    } catch (error) {
        console.error('Failed to delete user:', error);
        toast({
            title: 'Firebase Error',
            description: 'Could not delete user. See console for details.',
            variant: 'destructive'
        });
    }
  };


  return (
    <>
      <MainNav />
      <SidebarInset className="flex-col items-center justify-start p-4 sm:p-8">
        <div className="w-full max-w-7xl space-y-8">
          <header className="flex w-full items-center gap-4 text-left">
            <SidebarTrigger />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                All Users
              </h1>
              <p className="text-muted-foreground mt-2">
                A list of all users from the /RevitUsers path in your database.
              </p>
            </div>
          </header>

          <Dialog onOpenChange={(open) => !open && setSelectedUser(null)}>
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users />
                    User Data
                  </CardTitle>
                  <CardDescription>
                    {isLoading
                      ? 'Loading user data...'
                      : `Showing ${filteredUsers.length} of ${users.length} users. Click a row to see details.`}
                  </CardDescription>
                </div>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new user.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
                      {headers.map(header => (
                        <div key={header} className="grid w-full items-center gap-1.5">
                          <Label htmlFor={`new-user-${header}`}>
                            {header}
                          </Label>
                          <Input
                            id={`new-user-${header}`}
                            value={newUser[header] || ''}
                            onChange={(e) => handleNewUserChange(header, e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                         <Button type="button" variant="secondary">
                           Cancel
                         </Button>
                      </DialogClose>
                      <Button onClick={handleAddUser} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : 'Save User'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : users.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header) => (
                            <TableHead key={header} className="min-w-[180px]">
                              <div className="flex flex-col gap-2">
                                  {header}
                                  <Input
                                      placeholder={`Filter ${header}...`}
                                      value={filters[header] || ''}
                                      onChange={(e) => handleFilterChange(header, e.target.value)}
                                      className="h-8"
                                  />
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user, index) => (
                          <DialogTrigger asChild key={user.id || index}>
                            <TableRow 
                              className={cn("cursor-pointer", index % 2 === 0 ? 'bg-muted/50' : '')}
                              onClick={() => handleRowClick(user)}
                            >
                              {headers.map((header) => (
                                <TableCell key={header}>
                                  {user[header] !== null && user[header] !== undefined ? String(user[header]) : <span className="text-muted-foreground/50">N/A</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          </DialogTrigger>
                        ))}
                         {filteredUsers.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={headers.length}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No results found for your filter.
                              </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12" />
                    <p className="mt-4 text-lg">No Users Found</p>
                    <p>There is no data at the /RevitUsers path in your database.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedUser && (
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserIcon />
                    User Details
                  </DialogTitle>
                   <DialogDescription>
                    Information for {selectedUser['User Name'] || selectedUser.id}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {Object.entries(editableUser || {}).map(([key, value]) => (
                    key !== 'id' && (
                        <div key={key} className="grid grid-cols-[1fr_2fr] items-center gap-4">
                            <Label htmlFor={`edit-${key}`} className="text-sm font-medium text-muted-foreground text-right">{key}</Label>
                             {isEditing ? (
                                <Input
                                    id={`edit-${key}`}
                                    value={String(value)}
                                    onChange={(e) => handleEditableUserChange(key, e.target.value)}
                                    className="text-sm"
                                    disabled={isSubmitting}
                                />
                             ) : (
                                <span className="text-sm">{String(value)}</span>
                             )}
                        </div>
                    )
                  ))}
                </div>
                 <DialogFooter>
                    {isEditing ? (
                        <>
                           <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancel</Button>
                           <Button onClick={handleSaveUser} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Save Changes
                           </Button>
                        </>
                    ) : (
                        <>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user
                                            "{selectedUser['User Name'] || selectedUser.id}" from the database.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteUser}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           <Button onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </>
                    )}
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>

        </div>
      </SidebarInset>
    </>
  );
}

    