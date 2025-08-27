
'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Project } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { User, Users, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';


type KeyContactDetails = {
    team?: string;
    revitLevel?: string;
    rhinoLevel?: string;
    position?: string;
}

export default function PeopleAnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [keyContactDetails, setKeyContactDetails] = useState<{ [key: string]: KeyContactDetails }>({});
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const proficiencyLevels = ['Low', 'Medium', 'Proficient'];

  useEffect(() => {
    const db = getDatabase(app);
    const projectDataRef = ref(db, 'ProjectData');
    const keyContactDetailsRef = ref(db, 'KeyContactDetails');

    let projectsLoaded = false;
    let detailsLoaded = false;
    
    const checkLoading = () => {
        if (projectsLoaded && detailsLoaded) {
            setIsLoading(false);
        }
    }

    const unsubscribeProjects = onValue(
      projectDataRef,
      (snapshot) => {
        const allProjects: Project[] = [];
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          Object.values(rawData).forEach((projectList) => {
            if (Array.isArray(projectList)) {
              allProjects.push(...projectList);
            }
          });
        }

        if (allProjects.length > 0) {
          const newHeaders = Object.keys(allProjects[0] || {});
          setHeaders(newHeaders);
          setProjects(allProjects);
        } else {
          setProjects([]);
          setHeaders([]);
        }
        projectsLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error('Firebase read failed:', error);
        toast({
          title: 'Firebase Error',
          description: 'Could not fetch project data from Firebase.',
          variant: 'destructive',
        });
        projectsLoaded = true;
        checkLoading();
      }
    );

    const unsubscribeDetails = onValue(keyContactDetailsRef, (snapshot) => {
        if (snapshot.exists()) {
            setKeyContactDetails(snapshot.val());
        } else {
            setKeyContactDetails({});
        }
        detailsLoaded = true;
        checkLoading();
    }, (error) => {
        console.error("Firebase read for Key Contact Details failed:", error);
        toast({
            title: 'Firebase Error',
            description: 'Could not fetch key contact details.',
            variant: 'destructive',
        });
        detailsLoaded = true;
        checkLoading();
    });

    return () => {
        unsubscribeProjects();
        unsubscribeDetails();
    };
  }, [toast]);

  const { keyContactsList, categories } = useMemo(() => {
    const keyContactKey = headers.find((h) => h.toLowerCase().includes('key contact'));
    const categoryKey = headers.find((h) => h.toLowerCase().includes('category'));

    if (!keyContactKey || projects.length === 0) {
      return { keyContactsList: [], categories: [] };
    }

    const contactCounts: { [key: string]: number } = {};
    const categorySet = new Set<string>();

    projects.forEach((project) => {
      const contact = project[keyContactKey];
      if (typeof contact === 'string' && contact.trim() !== '') {
        contactCounts[contact] = (contactCounts[contact] || 0) + 1;
      }
      if (categoryKey) {
        const category = project[categoryKey];
        if (typeof category === 'string' && category.trim() !== '') {
          categorySet.add(category);
        }
      }
    });

    const keyContactsList = Object.keys(contactCounts).sort();
    const categories = Array.from(categorySet).sort();

    return { keyContactsList, categories };
  }, [projects, headers]);

  const filteredKeyContacts = useMemo(() => {
    return keyContactsList.filter(contact => {
      const contactLower = contact.toLowerCase();
      const teamLower = (keyContactDetails[contact]?.team || '').toLowerCase();
      const revitLower = (keyContactDetails[contact]?.revitLevel || '').toLowerCase();
      const rhinoLower = (keyContactDetails[contact]?.rhinoLevel || '').toLowerCase();
      const positionLower = (keyContactDetails[contact]?.position || '').toLowerCase();

      const filterContact = filters['contact']?.toLowerCase() || '';
      const filterTeam = filters['team']?.toLowerCase() || '';
      const filterRevit = filters['revitLevel']?.toLowerCase() || '';
      const filterRhino = filters['rhinoLevel']?.toLowerCase() || '';
      const filterPosition = filters['position']?.toLowerCase() || '';

      return (
        contactLower.includes(filterContact) &&
        teamLower.includes(filterTeam) &&
        revitLower.includes(filterRevit) &&
        rhinoLower.includes(filterRhino) &&
        positionLower.includes(filterPosition)
      );
    });
  }, [keyContactsList, keyContactDetails, filters]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleDetailChange = (contact: string, field: keyof KeyContactDetails, value: string) => {
    setKeyContactDetails(prev => ({
      ...prev,
      [contact]: {
        ...(prev[contact] || {}),
        [field]: value,
      }
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        const db = getDatabase(app);
        const detailsRef = ref(db, 'KeyContactDetails');
        await set(detailsRef, keyContactDetails);
        toast({
            title: 'Changes Saved',
            description: 'Key contact details have been updated.',
        });
    } catch (error) {
        console.error('Failed to save key contact details:', error);
        toast({
            title: 'Firebase Error',
            description: 'Could not save changes. See console for details.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
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
                People Analytics
              </h1>
              <p className="text-muted-foreground mt-2">
                An overview of project distribution among team members.
              </p>
            </div>
          </header>

          <div className="grid gap-8 md:grid-cols-1">
            
            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : keyContactsList.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users />
                      Key Contacts
                    </CardTitle>
                    <CardDescription>
                      A list of all key contacts and their teams.
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            Contact
                            <Input
                              placeholder="Filter..."
                              value={filters['contact'] || ''}
                              onChange={(e) => handleFilterChange('contact', e.target.value)}
                              className="mt-1 h-8"
                            />
                          </TableHead>
                           <TableHead>
                            Position
                            <Input
                              placeholder="Filter..."
                              value={filters['position'] || ''}
                              onChange={(e) => handleFilterChange('position', e.target.value)}
                              className="mt-1 h-8"
                            />
                          </TableHead>
                          <TableHead>
                            Team
                            <Input
                              placeholder="Filter..."
                              value={filters['team'] || ''}
                              onChange={(e) => handleFilterChange('team', e.target.value)}
                              className="mt-1 h-8"
                            />
                          </TableHead>
                          <TableHead>
                            Revit Level
                             <Input
                              placeholder="Filter..."
                              value={filters['revitLevel'] || ''}
                              onChange={(e) => handleFilterChange('revitLevel', e.target.value)}
                              className="mt-1 h-8"
                            />
                          </TableHead>
                          <TableHead>
                            Rhino Level
                            <Input
                              placeholder="Filter..."
                              value={filters['rhinoLevel'] || ''}
                              onChange={(e) => handleFilterChange('rhinoLevel', e.target.value)}
                              className="mt-1 h-8"
                            />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKeyContacts.map((contact, index) => (
                          <TableRow key={contact} className={cn(index % 2 === 0 ? 'bg-muted/50' : '')}>
                            <TableCell className="font-medium flex items-center gap-4">
                               <Avatar>
                                  <AvatarFallback>
                                      {contact.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                              </Avatar>
                              {contact}
                            </TableCell>
                            <TableCell>
                                <Input
                                  value={keyContactDetails[contact]?.position || ''}
                                  onChange={(e) => handleDetailChange(contact, 'position', e.target.value)}
                                  placeholder="Enter position"
                                  disabled={isSaving}
                                />
                            </TableCell>
                            <TableCell>
                               <Select
                                  value={keyContactDetails[contact]?.team || ''}
                                  onValueChange={(value) => handleDetailChange(contact, 'team', value)}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {categories.length > 0 ? (
                                        categories.map(category => (
                                          <SelectItem key={category} value={category}>
                                              {category}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="none" disabled>
                                          No categories found
                                        </SelectItem>
                                      )}
                                  </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select
                                  value={keyContactDetails[contact]?.revitLevel || ''}
                                  onValueChange={(value) => handleDetailChange(contact, 'revitLevel', value)}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {proficiencyLevels.map(level => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select
                                  value={keyContactDetails[contact]?.rhinoLevel || ''}
                                  onValueChange={(value) => handleDetailChange(contact, 'rhinoLevel', value)}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {proficiencyLevels.map(level => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </SidebarInset>
    </>
  );
}

    

    