'use client';

import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, set, onValue, push, get } from 'firebase/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Skeleton } from '@/components/ui/skeleton';


export default function AddProjectPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [bimLeads, setBimLeads] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [keyContacts, setKeyContacts] = useState<string[]>([]);
  const [revitVersions, setRevitVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [newProject, setNewProject] = useState<Project>({});

  useEffect(() => {
    const db = getDatabase(app);
    const projectDataRef = ref(db, 'ProjectData');
    const bimLeadsRef = ref(db, 'BIMLeads');
    const categoriesRef = ref(db, 'Categories');
    const keyContactsRef = ref(db, 'KeyContacts');
    const revitVersionsRef = ref(db, 'RevitVersions');
    const defaultHeaders = ['Project Name', 'Category', 'BIM Lead', 'Key Contact', 'Revit Version', 'Description', 'Year', 'History comments'];

    const unsubscribeProjects = onValue(
      projectDataRef,
      (snapshot) => {
        setIsLoading(true);
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          let allProjects: Project[] = [];
          if (Array.isArray(rawData)) {
            allProjects = rawData;
          } else {
             Object.values(rawData).forEach((projectList) => {
               if (Array.isArray(projectList)) {
                allProjects.push(...projectList);
              }
            });
          }

          if (allProjects.length > 0) {
            let projectHeaders = Object.keys(allProjects[0]);
            if (!projectHeaders.find(h => h.toLowerCase().includes('history comments'))) {
              projectHeaders.push('History comments');
            }
             if (!projectHeaders.find(h => h.toLowerCase().includes('description'))) {
              projectHeaders.push('Description');
            }
             if (!projectHeaders.find(h => h.toLowerCase().includes('year'))) {
              projectHeaders.push('Year');
            }
             if (!projectHeaders.find(h => h.toLowerCase().includes('key contact'))) {
              projectHeaders.push('Key Contact');
            }
             if (!projectHeaders.find(h => h.toLowerCase().includes('revit version'))) {
              projectHeaders.push('Revit Version');
            }
            setHeaders(projectHeaders.filter(h => h !== '__id__'));
            
          } else {
             setHeaders(defaultHeaders);
          }
        } else {
           setHeaders(defaultHeaders);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Firebase read for headers failed:', error);
        toast({
          title: 'Firebase Error',
          description: 'Could not fetch project structure from Firebase.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );

    const unsubscribeBimLeads = onValue(bimLeadsRef, (snapshot) => {
      if(snapshot.exists()) {
        const leadsData = snapshot.val();
        const leadsArray = Array.isArray(leadsData) ? leadsData : Object.values(leadsData);
        setBimLeads(leadsArray.filter(Boolean).sort());
      } else {
        setBimLeads([]);
      }
    });
    
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      if(snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : Object.values(categoriesData);
        setCategories(categoriesArray.filter(Boolean).sort());
      } else {
        setCategories([]);
      }
    });

    const unsubscribeKeyContacts = onValue(keyContactsRef, (snapshot) => {
      if(snapshot.exists()) {
        const contactsData = snapshot.val();
        const contactsArray = Array.isArray(contactsData) ? contactsData : Object.values(contactsData);
        setKeyContacts(contactsArray.filter(Boolean).sort());
      } else {
        setKeyContacts([]);
      }
    });

    const unsubscribeRevitVersions = onValue(revitVersionsRef, (snapshot) => {
      if(snapshot.exists()) {
        const versionsData = snapshot.val();
        const versionsArray = Array.isArray(versionsData) ? versionsData : Object.values(versionsData);
        setRevitVersions(versionsArray.filter(Boolean).sort());
      } else {
        setRevitVersions([]);
      }
    });

    return () => {
      unsubscribeProjects();
      unsubscribeBimLeads();
      unsubscribeCategories();
      unsubscribeKeyContacts();
      unsubscribeRevitVersions();
    };
  }, [toast]);
  
  const handleNewProjectChange = (header: string, value: string) => {
    setNewProject((prev) => ({
      ...prev,
      [header]: value,
    }));
  };
  
  const handleAddProject = async () => {
    if (Object.values(newProject).every((v) => !v || v === '')) {
      toast({
        title: 'Cannot Add Project',
        description: 'Please fill out at least one field.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const db = getDatabase(app);
      const dbRef = ref(db, 'ProjectData');

      const snapshot = await get(dbRef);
      let targetArrayKey: string | null = null;
      let targetArray: Project[] = [];
      
      if(snapshot.exists()) {
          const data = snapshot.val();
          const keys = Object.keys(data);
          if (keys.length > 0) {
            targetArrayKey = keys[keys.length - 1];
            targetArray = data[targetArrayKey] || [];
          }
      }

      if (!targetArrayKey) {
        targetArrayKey = Date.now().toString();
      }

      const projectToAdd: Project = {};
      for (const header of headers) {
        if (header.toLowerCase().includes('history comments')) {
            projectToAdd[header] = [];
        } else {
            projectToAdd[header] = newProject[header] || null;
        }
      }
      
      targetArray.push(projectToAdd);
      
      const updates: { [key: string]: any } = {};
      updates[targetArrayKey] = targetArray;
      
      await set(ref(db, `ProjectData/${targetArrayKey}`), targetArray);

      setNewProject({});
      toast({
        title: 'Project Added',
        description: 'Your new project has been saved to Firebase.',
      });
    } catch(error) {
       console.error('Failed to add project to Firebase:', error);
       toast({
        title: 'Firebase Error',
        description: 'Could not save the new project. See console for details.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
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
                Add New Project
              </h1>
              <p className="text-muted-foreground mt-2">
                Create a new project entry in your database.
              </p>
            </div>
          </header>
          
          {isLoading ? (
             <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
             </Card>
          ) : headers.length > 0 ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Enter Project Details</CardTitle>
                <CardDescription>
                  Fill out the form below and click &quot;Add Project&quot; to save it to Firebase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {headers.map((header) => (
                    <div key={header} className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor={`new-${header}`}>{header}</Label>
                      {header.toLowerCase().includes('bim lead') ? (
                         <Select
                          onValueChange={(value) => handleNewProjectChange(header, value)}
                          value={(newProject[header] as string) || ''}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${header}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {bimLeads.length > 0 ? bimLeads.map(lead => (
                              <SelectItem key={lead} value={lead}>{lead}</SelectItem>
                            )) : <SelectItem value="none" disabled>No leads configured</SelectItem>}
                          </SelectContent>
                        </Select>
                      ) : header.toLowerCase().includes('category') ? (
                         <Select
                          onValueChange={(value) => handleNewProjectChange(header, value)}
                          value={(newProject[header] as string) || ''}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${header}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length > 0 ? categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            )) : <SelectItem value="none" disabled>No categories configured</SelectItem>}
                          </SelectContent>
                        </Select>
                      ) : header.toLowerCase().includes('key contact') ? (
                         <Select
                          onValueChange={(value) => handleNewProjectChange(header, value)}
                          value={(newProject[header] as string) || ''}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${header}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {keyContacts.length > 0 ? keyContacts.map(contact => (
                              <SelectItem key={contact} value={contact}>{contact}</SelectItem>
                            )) : <SelectItem value="none" disabled>No key contacts configured</SelectItem>}
                          </SelectContent>
                        </Select>
                      ) : header.toLowerCase().includes('revit version') ? (
                         <Select
                          onValueChange={(value) => handleNewProjectChange(header, value)}
                          value={(newProject[header] as string) || ''}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${header}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {revitVersions.length > 0 ? revitVersions.map(version => (
                              <SelectItem key={version} value={version}>{version}</SelectItem>
                            )) : <SelectItem value="none" disabled>No versions configured</SelectItem>}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`new-${header}`}
                          type="text"
                          placeholder={`Enter ${header}`}
                          value={(newProject[header] as string) || ''}
                          onChange={(e) => handleNewProjectChange(header, e.target.value)}
                          disabled={isSubmitting || header.toLowerCase().includes('history comments')}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleAddProject} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? 'Adding...' : 'Add Project'}
                </Button>
              </CardFooter>
            </Card>
          ) : (
             <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">No Project Structure Found</h3>
                    <p className="mt-2">Cannot add a new project because no data has been uploaded yet.</p>
                    <p>Please upload a CSV file in the Data Management page first.</p>
                </CardContent>
             </Card>
          )}
        </div>
      </SidebarInset>
    </>
  );
}
