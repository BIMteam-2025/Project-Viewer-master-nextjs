'use client';

import { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react';
import type { Project, SortConfig } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Search, FileText } from 'lucide-react';
import { ProjectTable } from '@/components/project-table';
import { useToast } from '@/hooks/use-toast';
import { guessColumnTypes } from '@/ai/flows/guess-column-types';
import { Skeleton } from '@/components/ui/skeleton';
import { app } from '@/lib/firebase';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';

function parseCSV(
  csvText: string,
  types: ('string' | 'number' | 'boolean' | 'date')[]
): { parsedHeaders: string[]; parsedData: Project[] } {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return { parsedHeaders: [], parsedData: [] };

  const parsedHeaders = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/"/g, ''));

  const data = lines.slice(1).map((line) => {
    const row: Project = {};
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    parsedHeaders.forEach((header, i) => {
      if (i < values.length) {
        let value: any = values[i].trim().replace(/^"|"$/g, '');
        const type = types[i] || 'string';

        if (header.toLowerCase().includes('history comments')) {
           value = []; // Initialize as empty array
        } else if (type === 'number') {
          const num = parseFloat(value);
          value = isNaN(num) ? null : num;
        } else if (type === 'boolean') {
          if (value.toLowerCase() === 'true') value = true;
          else if (value.toLowerCase() === 'false') value = false;
          else value = null;
        } else if (type === 'date') {
          const date = new Date(value);
          value = isNaN(date.getTime()) ? null : date;
        }
        row[header] = value;
      } else {
        row[header] = null;
      }
    });
    return row;
  });

  return { parsedHeaders, parsedData: data };
}


export default function DataPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const db = getDatabase(app);
    const projectDataRef = ref(db, 'ProjectData');

    const unsubscribe = onValue(
      projectDataRef,
      async (snapshot) => {
        setIsLoading(true);
        let allProjects: Project[] = [];
        if (snapshot.exists()) {
          const rawData = snapshot.val();
           Object.keys(rawData).forEach((listKey) => {
              const projectList = rawData[listKey];
              if (Array.isArray(projectList)) {
                projectList.forEach((project, index) => {
                  if (project) {
                    allProjects.push({...project, __id__: `${listKey}_${index}`});
                  }
                });
              }
            });
        }
        
        if (allProjects.length > 0) {
          const newHeaders = Object.keys(allProjects[0] || {}).filter(h => h !== '__id__');
          setHeaders(newHeaders);
          setProjects(allProjects);
        } else {
          setProjects([]);
          setHeaders([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Firebase read failed:', error);
        toast({
          title: 'Firebase Error',
          description: 'Could not fetch data from Firebase.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);
  
    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({
          title: 'Error',
          description: 'The file is empty.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      try {
        const { columnTypes } = await guessColumnTypes({ csvData: text });
        const { parsedData } = parseCSV(text, columnTypes);
        
        if (parsedData.length === 0) {
          toast({
            title: 'No Data',
            description: 'No data was found in the CSV to upload.',
            variant: 'destructive',
          });
          return;
        }

        const db = getDatabase(app);
        // We use a timestamp for a unique key for each upload batch
        const dbRef = ref(db, `ProjectData/${Date.now()}`);
        await set(dbRef, parsedData);

        toast({
          title: 'Upload Successful',
          description: `${parsedData.length} projects have been uploaded to Firebase.`,
        });

      } catch (error) {
        console.error('Failed to process or upload CSV:', error);
        toast({
          title: 'Processing Error',
          description:
            'Could not process or upload the CSV. Please check the file format and console for details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
      setIsLoading(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        let projectValue = project[key];
        if (key.toLowerCase().includes('history comments') && Array.isArray(projectValue)) {
            projectValue = projectValue.length;
        }
        return String(projectValue).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [projects, filters]);
  
  return (
    <>
      <MainNav />
      <SidebarInset className="flex-col items-center justify-start p-4 sm:p-8">
        <div className="w-full max-w-7xl space-y-8">
          <header className="flex w-full items-center gap-4 text-left">
            <SidebarTrigger />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                Data Management
              </h1>
              <p className="text-muted-foreground mt-2">
                View, filter, and sort your project data.
              </p>
            </div>
          </header>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Project Data</CardTitle>
              <CardDescription>
                {projects.length > 0
                  ? `Showing ${filteredProjects.length} of ${projects.length} projects.`
                  : 'No project data found. Check your Firebase data or add a new project.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : projects.length > 0 ? (
                <ProjectTable
                  headers={headers}
                  projects={filteredProjects}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12" />
                  <p className="mt-4 text-lg">No data to display</p>
                  <p>Add a new project or check your Firebase connection.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Data Controls</CardTitle>
              <CardDescription>
                Upload a new CSV file to your dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-accent hover:bg-accent/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}
