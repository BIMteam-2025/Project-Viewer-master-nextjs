
'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@/types';
import { app } from '@/lib/firebase';
import { getDatabase, ref, get, update, set } from 'firebase/database';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MainNav } from '@/components/main-nav';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { FileText, ArrowLeft, PlusCircle, Loader2, Save, MessageSquarePlus, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [editableProject, setEditableProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const { toast } = useToast();

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      if (!params.id) {
          throw new Error('No project ID provided.');
      }
      const [listKey, projectIndex] = params.id.split('_');
      if (!listKey || !projectIndex) {
          throw new Error('Invalid project ID format.');
      }

      const db = getDatabase(app);
      const projectRef = ref(
        db,
        `ProjectData/${listKey}/${projectIndex}`
      );

      const snapshot = await get(projectRef);

      if (snapshot.exists()) {
        const projectData = snapshot.val();
        setProject(projectData);
        setEditableProject(projectData);
      } else {
        setError('Project not found.');
      }
    } catch (e: any) {
      console.error('Firebase read failed:', e);
      setError(e.message || 'Failed to fetch project data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const handleFieldChange = (key: string, value: string) => {
    setEditableProject(prev => prev ? { ...prev, [key]: value } : null);
  };
  
  const handleSaveChanges = async () => {
    if (!editableProject) return;

    setIsSaving(true);
    try {
        const [listKey, projectIndex] = params.id.split('_');
        const db = getDatabase(app);
        const projectRef = ref(db, `ProjectData/${listKey}/${projectIndex}`);
        
        // Don't save history comments this way, it's handled separately.
        const projectToUpdate = {...editableProject};
        const historyKey = Object.keys(projectToUpdate).find(k => k.toLowerCase().includes('history comments'));
        if (historyKey) {
            delete projectToUpdate[historyKey];
        }

        await update(projectRef, projectToUpdate);

        toast({
            title: 'Changes Saved',
            description: 'Your updates have been saved to Firebase.',
        });
        fetchProject(); // Refetch to sync state
    } catch (e: any) {
        console.error('Failed to save changes:', e);
        toast({
            title: 'Error Saving',
            description: 'Could not save your changes. See console for details.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleAddAttribute = async () => {
    if (!newFieldName.trim()) {
        toast({
            title: 'Field Name Required',
            description: 'Please enter a name for the new field.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const [listKey, projectIndex] = params.id.split('_');
        const db = getDatabase(app);
        const projectRef = ref(db, `ProjectData/${listKey}/${projectIndex}`);

        const updates: { [key: string]: any } = {};
        updates[newFieldName] = newFieldValue;

        await update(projectRef, updates);

        toast({
            title: 'Field Added',
            description: `The new field "${newFieldName}" has been added to the project.`,
        });

        // Clear inputs and refetch project data
        setNewFieldName('');
        setNewFieldValue('');
        fetchProject();

    } catch (e: any) {
        console.error('Failed to add attribute:', e);
        toast({
            title: 'Error',
            description: 'Could not add the new field. See console for details.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please enter a comment.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingComment(true);
    try {
      const [listKey, projectIndex] = params.id.split('_');
      const db = getDatabase(app);
      
      const historyKey = Object.keys(project || {}).find(k => k.toLowerCase().includes('history comments')) || 'History comments';
      const commentsRef = ref(db, `ProjectData/${listKey}/${projectIndex}/${historyKey}`);

      const snapshot = await get(commentsRef);
      const existingComments = snapshot.val() || [];
      if (!Array.isArray(existingComments)) {
        console.error("History comments is not an array:", existingComments);
        toast({ title: 'Data Inconsistency', description: 'History comments field is not structured as an array.', variant: 'destructive'});
        setIsAddingComment(false);
        return;
      }
      
      const newComments = [...existingComments, `${new Date().toISOString()}: ${newComment}`];

      await set(commentsRef, newComments);

      toast({
        title: 'Comment Added',
        description: 'Your comment has been saved.',
      });
      setNewComment('');
      fetchProject();
    } catch (e: any) {
      console.error('Failed to add comment:', e);
      toast({
        title: 'Error Adding Comment',
        description: 'Could not save your comment. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const historyKey = project ? Object.keys(project).find(k => k.toLowerCase().includes('history comments')) : null;
  const historyComments = historyKey && project && Array.isArray(project[historyKey]) ? project[historyKey] as string[] : [];

  return (
    <>
      <MainNav />
      <SidebarInset className="flex-col items-center justify-start p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-8">
            <header className="flex w-full items-center gap-4 text-left">
                <SidebarTrigger />
                <div>
                    <Button variant="ghost" asChild>
                      <Link href="/data">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Data
                      </Link>
                    </Button>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                        Project Details
                    </h1>
                </div>
            </header>

          {isLoading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-1/2" />
                </div>
                 <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-1/2" />
                </div>
                 <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-1/2" />
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && (error || !project) && (
            <Card>
              <CardContent className="py-10 text-center text-destructive">
                <h3 className="text-lg font-semibold">Error</h3>
                <p className="mt-2">{error || 'Could not load project details.'}</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && editableProject && (
            <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText />
                        {project?.['Project Name'] || project?.name || `Project ${params.id}`}
                    </CardTitle>
                    <CardDescription>
                      Detailed information for the selected project. Modify the fields and click save.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(editableProject).map(([key, value]) => (
                        key !== '__id__' && !key.toLowerCase().includes('history comments') && (
                            <div key={key} className="grid w-full items-center gap-1.5">
                                <Label htmlFor={key} className="text-muted-foreground">{key}</Label>
                                <Input
                                    id={key}
                                    type="text"
                                    value={String(value ?? '')}
                                    onChange={(e) => handleFieldChange(key, e.target.value)}
                                    className="max-w-md"
                                    disabled={isSaving}
                                />
                            </div>
                        )
                    ))}
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardFooter>
                </Card>

                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History />
                      History Comments
                    </CardTitle>
                    <CardDescription>
                      View and add comments for this project.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {historyComments.length > 0 ? (
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                        {historyComments.map((comment, index) => (
                          <li key={index}>{comment}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No comments yet.</p>
                    )}
                     <div className="grid w-full items-center gap-1.5 pt-4">
                        <Label htmlFor="new-comment">Add a new comment</Label>
                        <Textarea
                            id="new-comment"
                            placeholder="Type your comment here..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isAddingComment}
                        />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={handleAddComment} disabled={isAddingComment}>
                      {isAddingComment ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                      )}
                      {isAddingComment ? 'Adding...' : 'Add Comment'}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Add New Field</CardTitle>
                        <CardDescription>
                            Add a new field of information to this project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="new-field-name">Field Name</Label>
                            <Input
                                id="new-field-name"
                                type="text"
                                placeholder="e.g., 'Contact Person'"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="new-field-value">Field Value</Label>
                            <Input
                                id="new-field-value"
                                type="text"
                                placeholder="e.g., 'Jane Doe'"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={handleAddAttribute} disabled={isSubmitting || isSaving}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PlusCircle className="mr-2 h-4 w-4" />
                            )}
                            {isSubmitting ? 'Adding Field...' : 'Add Field'}
                        </Button>
                    </CardFooter>
                </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </>
  );
}
