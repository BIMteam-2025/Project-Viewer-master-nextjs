'use client';

import { useState, useEffect } from 'react';
import { MainNav } from '@/components/main-nav';
import { 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Import } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '@/types';

export default function SettingsPage() {
  const [bimLeads, setBimLeads] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [keyContacts, setKeyContacts] = useState<string[]>([]);
  const [revitVersions, setRevitVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLeadName, setNewLeadName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newKeyContactName, setNewKeyContactName] = useState('');
  const [newRevitVersion, setNewRevitVersion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isSubmittingKeyContact, setIsSubmittingKeyContact] = useState(false);
  const [isSubmittingRevitVersion, setIsSubmittingRevitVersion] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingKeyContacts, setIsSyncingKeyContacts] = useState(false);
  const [isSyncingRevitVersions, setIsSyncingRevitVersions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    const bimLeadsRef = ref(db, 'BIMLeads');
    const categoriesRef = ref(db, 'Categories');
    const keyContactsRef = ref(db, 'KeyContacts');
    const revitVersionsRef = ref(db, 'RevitVersions');
    
    setIsLoading(true);
    
    const unsubscribeBimLeads = onValue(bimLeadsRef, (snapshot) => {
      if (snapshot.exists()) {
        const leadsData = snapshot.val();
        const leadsArray = Array.isArray(leadsData) ? leadsData : Object.values(leadsData);
        setBimLeads(leadsArray.filter(Boolean).sort());
      } else {
        setBimLeads([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase read for BIM leads failed:", error);
      toast({
        title: 'Firebase Error',
        description: 'Could not fetch BIM leads from Firebase.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : Object.values(categoriesData);
        setCategories(categoriesArray.filter(Boolean).sort());
      } else {
        setCategories([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase read for Categories failed:", error);
      toast({
        title: 'Firebase Error',
        description: 'Could not fetch Categories from Firebase.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    const unsubscribeKeyContacts = onValue(keyContactsRef, (snapshot) => {
      if (snapshot.exists()) {
        const contactsData = snapshot.val();
        const contactsArray = Array.isArray(contactsData) ? contactsData : Object.values(contactsData);
        setKeyContacts(contactsArray.filter(Boolean).sort());
      } else {
        setKeyContacts([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase read for Key Contacts failed:", error);
      toast({
        title: 'Firebase Error',
        description: 'Could not fetch Key Contacts from Firebase.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });
    
    const unsubscribeRevitVersions = onValue(revitVersionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const versionsData = snapshot.val();
        const versionsArray = Array.isArray(versionsData) ? versionsData : Object.values(versionsData);
        setRevitVersions(versionsArray.filter(Boolean).sort());
      } else {
        setRevitVersions([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase read for Revit versions failed:", error);
      toast({
        title: 'Firebase Error',
        description: 'Could not fetch Revit versions from Firebase.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    return () => {
        unsubscribeBimLeads();
        unsubscribeCategories();
        unsubscribeKeyContacts();
        unsubscribeRevitVersions();
    };
  }, [toast]);
  
  const handleAddLead = async () => {
    if (!newLeadName.trim()) {
      toast({
        title: 'Lead Name Required',
        description: 'Please enter a name to add.',
        variant: 'destructive',
      });
      return;
    }

    if (bimLeads.some(lead => lead.toLowerCase() === newLeadName.trim().toLowerCase())) {
       toast({
        title: 'Duplicate Name',
        description: 'This BIM Lead already exists in the list.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const db = getDatabase(app);
      const updatedLeads = [...bimLeads, newLeadName.trim()];
      await set(ref(db, 'BIMLeads'), updatedLeads);

      toast({
        title: 'BIM Lead Added',
        description: `"${newLeadName.trim()}" has been added.`,
      });
      setNewLeadName('');
    } catch (error) {
      console.error('Failed to add BIM Lead:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not save the new BIM Lead. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLead = async (leadToRemove: string) => {
    if (!confirm(`Are you sure you want to remove "${leadToRemove}"?`)) {
      return;
    }
    
    try {
      const db = getDatabase(app);
      const updatedLeads = bimLeads.filter(lead => lead !== leadToRemove);
      await set(ref(db, 'BIMLeads'), updatedLeads);

      toast({
        title: 'BIM Lead Removed',
        description: `"${leadToRemove}" has been removed from the list.`,
      });
    } catch (error) {
      console.error('Failed to remove BIM Lead:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not remove the BIM Lead. See console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Category Name Required',
        description: 'Please enter a category name to add.',
        variant: 'destructive',
      });
      return;
    }

    if (categories.some(cat => cat.toLowerCase() === newCategoryName.trim().toLowerCase())) {
       toast({
        title: 'Duplicate Category',
        description: 'This category already exists in the list.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const db = getDatabase(app);
      const updatedCategories = [...categories, newCategoryName.trim()];
      await set(ref(db, 'Categories'), updatedCategories);

      toast({
        title: 'Category Added',
        description: `"${newCategoryName.trim()}" has been added.`,
      });
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to add Category:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not save the new category. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleRemoveCategory = async (categoryToRemove: string) => {
    if (!confirm(`Are you sure you want to remove "${categoryToRemove}"?`)) {
      return;
    }
    
    try {
      const db = getDatabase(app);
      const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
      await set(ref(db, 'Categories'), updatedCategories);

      toast({
        title: 'Category Removed',
        description: `"${categoryToRemove}" has been removed from the list.`,
      });
    } catch (error) {
      console.error('Failed to remove Category:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not remove the category. See console for details.',
        variant: 'destructive',
      });
    }
  };
  
  const handleAddKeyContact = async () => {
    if (!newKeyContactName.trim()) {
      toast({
        title: 'Key Contact Name Required',
        description: 'Please enter a name to add.',
        variant: 'destructive',
      });
      return;
    }

    if (keyContacts.some(contact => contact.toLowerCase() === newKeyContactName.trim().toLowerCase())) {
       toast({
        title: 'Duplicate Name',
        description: 'This Key Contact already exists in the list.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingKeyContact(true);
    try {
      const db = getDatabase(app);
      const updatedContacts = [...keyContacts, newKeyContactName.trim()];
      await set(ref(db, 'KeyContacts'), updatedContacts);

      toast({
        title: 'Key Contact Added',
        description: `"${newKeyContactName.trim()}" has been added.`,
      });
      setNewKeyContactName('');
    } catch (error) {
      console.error('Failed to add Key Contact:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not save the new Key Contact. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingKeyContact(false);
    }
  };

  const handleRemoveKeyContact = async (contactToRemove: string) => {
    if (!confirm(`Are you sure you want to remove "${contactToRemove}"?`)) {
      return;
    }
    
    try {
      const db = getDatabase(app);
      const updatedContacts = keyContacts.filter(contact => contact !== contactToRemove);
      await set(ref(db, 'KeyContacts'), updatedContacts);

      toast({
        title: 'Key Contact Removed',
        description: `"${contactToRemove}" has been removed from the list.`,
      });
    } catch (error) {
      console.error('Failed to remove Key Contact:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not remove the Key Contact. See console for details.',
        variant: 'destructive',
      });
    }
  };

    const handleAddRevitVersion = async () => {
    if (!newRevitVersion.trim()) {
      toast({
        title: 'Revit Version Required',
        description: 'Please enter a version to add.',
        variant: 'destructive',
      });
      return;
    }

    if (revitVersions.some(v => v.toLowerCase() === newRevitVersion.trim().toLowerCase())) {
       toast({
        title: 'Duplicate Version',
        description: 'This Revit version already exists in the list.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingRevitVersion(true);
    try {
      const db = getDatabase(app);
      const updatedVersions = [...revitVersions, newRevitVersion.trim()];
      await set(ref(db, 'RevitVersions'), updatedVersions);

      toast({
        title: 'Revit Version Added',
        description: `"${newRevitVersion.trim()}" has been added.`,
      });
      setNewRevitVersion('');
    } catch (error) {
      console.error('Failed to add Revit Version:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not save the new Revit version. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingRevitVersion(false);
    }
  };

  const handleRemoveRevitVersion = async (versionToRemove: string) => {
    if (!confirm(`Are you sure you want to remove "${versionToRemove}"?`)) {
      return;
    }
    
    try {
      const db = getDatabase(app);
      const updatedVersions = revitVersions.filter(v => v !== versionToRemove);
      await set(ref(db, 'RevitVersions'), updatedVersions);

      toast({
        title: 'Revit Version Removed',
        description: `"${versionToRemove}" has been removed from the list.`,
      });
    } catch (error) {
      console.error('Failed to remove Revit Version:', error);
      toast({
        title: 'Firebase Error',
        description: 'Could not remove the Revit version. See console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleSyncCategories = async () => {
    setIsSyncing(true);
    try {
      const db = getDatabase(app);
      const projectDataRef = ref(db, 'ProjectData');
      const snapshot = await get(projectDataRef);

      if (!snapshot.exists()) {
        toast({ title: 'No Projects', description: 'No project data found to sync from.', variant: 'destructive' });
        return;
      }

      const allProjects: Project[] = [];
      const rawData = snapshot.val();
      Object.values(rawData).forEach((projectList: any) => {
        if (Array.isArray(projectList)) {
          allProjects.push(...projectList);
        }
      });
      
      const categoryKey = Object.keys(allProjects[0] || {}).find(h => h.toLowerCase().includes('category'));
      
      if (!categoryKey) {
         toast({ title: 'No Category Field', description: 'Could not find a "Category" field in your project data.', variant: 'destructive' });
         return;
      }

      const projectCategories = allProjects.map(p => p[categoryKey]).filter(Boolean) as string[];
      const uniqueCategories = Array.from(new Set([...categories, ...projectCategories]));
      
      await set(ref(db, 'Categories'), uniqueCategories.sort());

      toast({
        title: 'Categories Synced',
        description: 'Your category list has been updated with values from all existing projects.',
      });

    } catch (error) {
      console.error('Failed to sync categories:', error);
      toast({
        title: 'Sync Error',
        description: 'Could not sync categories from project data. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncKeyContacts = async () => {
    setIsSyncingKeyContacts(true);
    try {
      const db = getDatabase(app);
      const projectDataRef = ref(db, 'ProjectData');
      const snapshot = await get(projectDataRef);

      if (!snapshot.exists()) {
        toast({ title: 'No Projects', description: 'No project data found to sync from.', variant: 'destructive' });
        return;
      }

      const allProjects: Project[] = [];
      const rawData = snapshot.val();
      Object.values(rawData).forEach((projectList: any) => {
        if (Array.isArray(projectList)) {
          allProjects.push(...projectList);
        }
      });
      
      const keyContactKey = Object.keys(allProjects[0] || {}).find(h => h.toLowerCase().includes('key contact'));
      
      if (!keyContactKey) {
         toast({ title: 'No Key Contact Field', description: 'Could not find a "Key Contact" field in your project data.', variant: 'destructive' });
         return;
      }

      const projectKeyContacts = allProjects.map(p => p[keyContactKey]).filter(Boolean) as string[];
      const uniqueKeyContacts = Array.from(new Set([...keyContacts, ...projectKeyContacts]));
      
      await set(ref(db, 'KeyContacts'), uniqueKeyContacts.sort());

      toast({
        title: 'Key Contacts Synced',
        description: 'Your key contact list has been updated with values from all existing projects.',
      });

    } catch (error) {
      console.error('Failed to sync key contacts:', error);
      toast({
        title: 'Sync Error',
        description: 'Could not sync key contacts from project data. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingKeyContacts(false);
    }
  };
  
    const handleSyncRevitVersions = async () => {
    setIsSyncingRevitVersions(true);
    try {
      const db = getDatabase(app);
      const projectDataRef = ref(db, 'ProjectData');
      const snapshot = await get(projectDataRef);

      if (!snapshot.exists()) {
        toast({ title: 'No Projects', description: 'No project data found to sync from.', variant: 'destructive' });
        return;
      }

      const allProjects: Project[] = [];
      const rawData = snapshot.val();
      Object.values(rawData).forEach((projectList: any) => {
        if (Array.isArray(projectList)) {
          allProjects.push(...projectList);
        }
      });
      
      const revitVersionKey = Object.keys(allProjects[0] || {}).find(h => h.toLowerCase().includes('revit version'));
      
      if (!revitVersionKey) {
         toast({ title: 'No Revit Version Field', description: 'Could not find a "Revit Version" field in your project data.', variant: 'destructive' });
         return;
      }

      const projectRevitVersions = allProjects.map(p => p[revitVersionKey]).filter(Boolean) as string[];
      const uniqueRevitVersions = Array.from(new Set([...revitVersions, ...projectRevitVersions]));
      
      await set(ref(db, 'RevitVersions'), uniqueRevitVersions.sort());

      toast({
        title: 'Revit Versions Synced',
        description: 'Your Revit version list has been updated with values from all existing projects.',
      });

    } catch (error) {
      console.error('Failed to sync Revit versions:', error);
      toast({
        title: 'Sync Error',
        description: 'Could not sync Revit versions from project data. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingRevitVersions(false);
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
                Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your application settings.
              </p>
            </div>
          </header>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Manage BIM Leads</CardTitle>
                    <CardDescription>
                        Add or remove names from the pre-selected list for the "BIM Lead" field.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="new-lead-name">Add New BIM Lead</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                    <Input 
                        id="new-lead-name"
                        placeholder="Enter a new lead's name"
                        value={newLeadName}
                        onChange={(e) => setNewLeadName(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <Button onClick={handleAddLead} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                        <span className="ml-2 hidden sm:inline">{isSubmitting ? 'Adding...' : 'Add'}</span>
                    </Button>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-sm text-card-foreground mb-2">Existing BIM Leads</h4>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : bimLeads.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-2 max-h-96 overflow-y-auto">
                        {bimLeads.map(lead => (
                        <div key={lead} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <span className="text-sm">{lead}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveLead(lead)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove {lead}</span>
                            </Button>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-muted-foreground py-6">
                        <p>No BIM leads found.</p>
                        <p className="text-xs">Add one using the field above.</p>
                    </div>
                    )}
                </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>
                        Add or remove items from the pre-selected list for the "Category" field.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="new-category-name">Add New Category</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                    <Input 
                        id="new-category-name"
                        placeholder="Enter a new category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        disabled={isSubmittingCategory}
                    />
                    <Button onClick={handleAddCategory} disabled={isSubmittingCategory}>
                        {isSubmittingCategory ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                        <span className="ml-2 hidden sm:inline">{isSubmittingCategory ? 'Adding...' : 'Add'}</span>
                    </Button>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-sm text-card-foreground mb-2">Existing Categories</h4>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : categories.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-2 max-h-96 overflow-y-auto">
                        {categories.map(cat => (
                        <div key={cat} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <span className="text-sm">{cat}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCategory(cat)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove {cat}</span>
                            </Button>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-muted-foreground py-6">
                        <p>No categories found.</p>
                        <p className="text-xs">Add one using the field above.</p>
                    </div>
                    )}
                </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button onClick={handleSyncCategories} disabled={isSyncing}>
                      {isSyncing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                          <Import className="mr-2 h-4 w-4" />
                      )}
                      {isSyncing ? 'Syncing...' : 'Sync from Projects'}
                  </Button>
                </CardFooter>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Manage Key Contacts</CardTitle>
                    <CardDescription>
                        Add or remove names from the pre-selected list for the "Key Contact" field.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="new-key-contact-name">Add New Key Contact</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                    <Input 
                        id="new-key-contact-name"
                        placeholder="Enter a new contact's name"
                        value={newKeyContactName}
                        onChange={(e) => setNewKeyContactName(e.target.value)}
                        disabled={isSubmittingKeyContact}
                    />
                    <Button onClick={handleAddKeyContact} disabled={isSubmittingKeyContact}>
                        {isSubmittingKeyContact ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                        <span className="ml-2 hidden sm:inline">{isSubmittingKeyContact ? 'Adding...' : 'Add'}</span>
                    </Button>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-sm text-card-foreground mb-2">Existing Key Contacts</h4>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : keyContacts.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-2 max-h-96 overflow-y-auto">
                        {keyContacts.map(contact => (
                        <div key={contact} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <span className="text-sm">{contact}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveKeyContact(contact)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove {contact}</span>
                            </Button>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-muted-foreground py-6">
                        <p>No key contacts found.</p>
                        <p className="text-xs">Add one using the field above.</p>
                    </div>
                    )}
                </div>
                </CardContent>
                 <CardFooter className="justify-end">
                  <Button onClick={handleSyncKeyContacts} disabled={isSyncingKeyContacts}>
                      {isSyncingKeyContacts ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                          <Import className="mr-2 h-4 w-4" />
                      )}
                      {isSyncingKeyContacts ? 'Syncing...' : 'Sync from Projects'}
                  </Button>
                </CardFooter>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Manage Revit Versions</CardTitle>
                    <CardDescription>
                        Add or remove items from the pre-selected list for the "Revit version" field.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="new-revit-version">Add New Revit Version</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                    <Input 
                        id="new-revit-version"
                        placeholder="Enter a new version"
                        value={newRevitVersion}
                        onChange={(e) => setNewRevitVersion(e.target.value)}
                        disabled={isSubmittingRevitVersion}
                    />
                    <Button onClick={handleAddRevitVersion} disabled={isSubmittingRevitVersion}>
                        {isSubmittingRevitVersion ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                        <span className="ml-2 hidden sm:inline">{isSubmittingRevitVersion ? 'Adding...' : 'Add'}</span>
                    </Button>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-sm text-card-foreground mb-2">Existing Revit Versions</h4>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : revitVersions.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-2 max-h-96 overflow-y-auto">
                        {revitVersions.map(v => (
                        <div key={v} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <span className="text-sm">{v}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveRevitVersion(v)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove {v}</span>
                            </Button>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-muted-foreground py-6">
                        <p>No versions found.</p>
                        <p className="text-xs">Add one using the field above.</p>
                    </div>
                    )}
                </div>
                </CardContent>
                 <CardFooter className="justify-end">
                  <Button onClick={handleSyncRevitVersions} disabled={isSyncingRevitVersions}>
                      {isSyncingRevitVersions ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                          <Import className="mr-2 h-4 w-4" />
                      )}
                      {isSyncingRevitVersions ? 'Syncing...' : 'Sync from Projects'}
                  </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
