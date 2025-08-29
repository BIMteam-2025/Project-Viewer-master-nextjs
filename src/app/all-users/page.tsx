'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, onValue } from 'firebase/database';
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
import { Users } from 'lucide-react';

type RevitUser = {
  [key: string]: any;
  id?: string;
};

export default function AllUsersPage() {
  const [users, setUsers] = useState<RevitUser[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
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
          // Data can be an object or an array from Firebase
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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users />
                User Data
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading user data...'
                    : `Showing ${filteredUsers.length} of ${users.length} users.`}
              </CardDescription>
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
                        <TableRow key={user.id || index}>
                          {headers.map((header) => (
                            <TableCell key={header}>
                              {user[header] !== null && user[header] !== undefined ? String(user[header]) : <span className="text-muted-foreground/50">N/A</span>}
                            </TableCell>
                          ))}
                        </TableRow>
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
        </div>
      </SidebarInset>
    </>
  );
}