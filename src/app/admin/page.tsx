'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '@/context/AuthContext';

const accessKeySchema = z.object({
  accessKey: z.string().min(1, 'Access key is required'),
});

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be 6-18 characters').max(18, 'Password must be 6-18 characters'),
});

type AccessKeyFormData = z.infer<typeof accessKeySchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ADMIN_ACCESS_KEY = '36572515';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { toast } = useToast();

  const accessForm = useForm<AccessKeyFormData>({
    resolver: zodResolver(accessKeySchema),
    defaultValues: { accessKey: '' },
  });
  
  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });


  const handleAccessSubmit = (data: AccessKeyFormData) => {
    if (data.accessKey === ADMIN_ACCESS_KEY) {
      setIsAuthenticated(true);
      fetchUsers();
    } else {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'The provided access key is incorrect.',
      });
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ADMIN_ACCESS_KEY}` },
      });
      if (!response.ok) throw new Error('Failed to fetch users.');
      const data = await response.json();
      setUsers(Object.values(data));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load users.' });
    }
    setIsLoading(false);
  };
  
  const handleDeleteUser = async (username: string) => {
    if (confirm(`Are you sure you want to delete user: ${username}? This action is irreversible.`)) {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_ACCESS_KEY}` 
                },
                body: JSON.stringify({ action: 'delete-user', username }),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Failed to delete user.');
            }
            toast({ title: 'User Deleted', description: `User ${username} has been deleted.` });
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            setIsLoading(false);
        }
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
      if (!selectedUser) return;
      setIsLoading(true);
      try {
          const response = await fetch('/api/admin', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${ADMIN_ACCESS_KEY}` 
              },
              body: JSON.stringify({ action: 'reset-password', username: selectedUser.username, newPassword: data.newPassword }),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to reset password.');
          }
          toast({ title: 'Password Reset', description: `Password for ${selectedUser.username} has been reset.` });
          setIsResetDialogOpen(false);
          resetPasswordForm.reset();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
      setIsLoading(false);
  };
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><ShieldCheck/> Admin Access</CardTitle>
            <CardDescription>Please enter the access key to manage the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...accessForm}>
              <form onSubmit={accessForm.handleSubmit(handleAccessSubmit)} className="space-y-4">
                <FormField
                  control={accessForm.control}
                  name="accessKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Authenticate
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View, delete, or reset passwords for users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <div className="flex justify-center items-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.nickname}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isResetDialogOpen && selectedUser?.username === user.username} onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setIsResetDialogOpen(false);
                                setSelectedUser(null);
                                resetPasswordForm.reset();
                            }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                                setSelectedUser(user);
                                setIsResetDialogOpen(true);
                            }}>
                              <KeyRound className="mr-1 h-4 w-4" /> Reset Pass
                            </Button>
                          </DialogTrigger>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.username)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
             {isResetDialogOpen && selectedUser && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password for {selectedUser.nickname}</DialogTitle>
                        <DialogDescription>
                            Enter a new password. The user will not be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...resetPasswordForm}>
                        <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4 py-4">
                             <FormField
                                control={resetPasswordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter new temporary password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Set Password
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
