
'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Project } from '@/types';
import {Card, CardHeader,CardTitle, CardDescription,CardContent, CardFooter} from '@/components/ui/card';
import { Home as HomeIcon, AlertCircle, ListTree, User, FolderTree, Group, LineChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, onValue } from 'firebase/database';
import {  SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import * as RechartsPrimitive from 'recharts';
import { ChartContainer,ChartTooltip,ChartTooltipContent, ChartLegend, ChartLegendContent} from '@/components/ui/chart';
import type { ChartConfig as ChartConfigType } from '@/components/ui/chart';
import { MainNav } from '@/components/main-nav';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    const projectDataRef = ref(db, 'ProjectData');

    const unsubscribe = onValue(
      projectDataRef,
      async (snapshot) => {
        setIsLoading(true);
        const allProjects: Project[] = [];
        let rawData: any = {};
        if (snapshot.exists()) {
          rawData = snapshot.val();
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

  const dashboardStats = useMemo(() => {
    const totalProjects = projects.length;
    const incompleteEntries = projects.filter(p => Object.values(p).some(v => v === null || v === undefined || v === '')).length;
    return { totalProjects, incompleteEntries };
  }, [projects]);
  
  const pieChartData = useMemo(() => {
    if (dashboardStats.totalProjects === 0) {
      return { data: [], config: {} as ChartConfigType };
    }
    const completeEntries = dashboardStats.totalProjects - dashboardStats.incompleteEntries;
    const data = [
      { name: 'Complete', value: completeEntries, fill: 'hsl(var(--chart-1))' },
      { name: 'Incomplete', value: dashboardStats.incompleteEntries, fill: 'hsl(var(--chart-2))' },
    ];
    const config = {
      value: {
        label: 'Projects',
      },
      Complete: {
        label: 'Complete',
        color: 'hsl(var(--chart-1))',
      },
      Incomplete: {
        label: 'Incomplete',
        color: 'hsl(var(--chart-2))',
      },
    } as ChartConfigType;

    return { data, config };
  }, [dashboardStats]);

  const { chartData, chartConfig } = useMemo(() => {
    if (projects.length < 1 || headers.length === 0) {
        return { chartData: [], chartConfig: null };
    }

    const isMostlyNumeric = (key: string) => {
        const numericCount = projects.reduce((acc, p) => acc + (typeof p[key] === 'number' ? 1 : 0), 0);
        return numericCount / projects.length > 0.5;
    };
    
    const isMostlyString = (key: string) => {
        const stringCount = projects.reduce((acc, p) => acc + (typeof p[key] === 'string' && p[key] ? 1 : 0), 0);
        return stringCount / projects.length > 0.5;
    };

    let yKey: string | null = null;
    for (const header of headers) {
        if (isMostlyNumeric(header)) {
            yKey = header;
            break;
        }
    }
    
    let xKey: string | null = null;
    for (const header of headers) {
        if (header !== yKey && isMostlyString(header)) {
            xKey = header;
            break;
        }
    }

    if (!xKey || !yKey) {
        return { chartData: [], chartConfig: null };
    }

    const data = projects
        .map(p => ({
            name: String(p[xKey!] || 'Unnamed').substring(0, 30),
            value: typeof p[yKey!] === 'number' ? p[yKey!] as number : 0,
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 12);
    
    if (data.length === 0) {
      return { chartData: [], chartConfig: null };
    }
    
    const config = {
        value: {
            label: yKey,
            color: "hsl(var(--chart-1))",
        },
    } as ChartConfigType;
    
    data.forEach(item => {
      config[item.name] = { label: item.name };
    });

    return { chartData: data, chartConfig: config };
}, [projects, headers]);

  
  const categoryChart = useMemo(() => {
    const categoryKey = headers.find(h => h.toLowerCase().includes('category'));

    if (!categoryKey || projects.length === 0) {
      return { data: [], config: null };
    }
    const categoryCounts = projects.reduce((acc, project) => {
      const category = project[categoryKey];
      if (typeof category === 'string' && category.trim() !== '') {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const chartData = Object.entries(categoryCounts).map(([name, value], index) => ({
      name,
      value,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));

    const chartConfig = {
      value: {
        label: 'Projects',
      },
      ...Object.fromEntries(
        chartData.map((d, i) => [
          d.name,
          {
            label: d.name,
            color: `hsl(var(--chart-${(i % 5) + 1}))`,
          },
        ])
      ),
    } as ChartConfigType;

    return { data: chartData, config: chartConfig };
  }, [projects, headers]);

  const revitVersionChart = useMemo(() => {
    const revitVersionKey = headers.find(h => h.toLowerCase().includes('revit'));
    const categoryKey = headers.find(h => h.toLowerCase().includes('category'));

    if (!revitVersionKey || !categoryKey || projects.length === 0) {
      return { data: [], config: {}, categories: [] };
    }

    const counts: { [version: string]: { [category: string]: number } } = {};
    const categories = new Set<string>();

    projects.forEach(p => {
      const version = p[revitVersionKey];
      const category = p[categoryKey];

      if (version && typeof category === 'string' && category.trim() !== '') {
        const versionStr = String(version).trim();
        categories.add(category);
        if (!counts[versionStr]) {
          counts[versionStr] = {};
        }
        counts[versionStr][category] = (counts[versionStr][category] || 0) + 1;
      }
    });
    
    const sortedVersions = Object.keys(counts).sort();

    const chartData = sortedVersions.map(version => {
      const entry: {[key: string]: string | number} = { revitVersion: version };
      categories.forEach(category => {
        entry[category] = counts[version][category] || 0;
      });
      return entry;
    });

    const categoryList = Array.from(categories);
    const chartConfig: ChartConfigType = {
       revitVersion: { label: 'Revit Version' }
    };

    categoryList.forEach((category, index) => {
      chartConfig[category] = {
        label: category,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });

    return { data: chartData, config: chartConfig, categories: categoryList };
  }, [projects, headers]);


  return (
    <>
      <MainNav />
      <SidebarInset className="flex-col items-center justify-start p-4 sm:p-8">
        <div className="w-full max-w-7xl space-y-8">
          <header className="flex w-full items-center gap-4 text-left">
            <SidebarTrigger />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                An overview of your project data.
              </p>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <HomeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">projects in dataset</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Data Columns</CardTitle>
                    <ListTree className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{headers.length}</div>
                    <p className="text-xs text-muted-foreground">attributes per project</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Incomplete Entries</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.incompleteEntries}</div>
                     <p className="text-xs text-muted-foreground">projects with missing data</p>
                </CardContent>
            </Card>
          </div>
          
           <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {chartData.length > 0 && chartConfig && (
                <Card>
                <CardHeader>
                    <CardTitle>Data Overview</CardTitle>
                    <CardDescription>
                    A chart showing the top items from your dataset.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart data={chartData} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
                </Card>
            )}
            {pieChartData.data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Data Completeness</CardTitle>
                        <CardDescription>
                            A breakdown of projects with complete vs. incomplete data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={pieChartData.config} className="min-h-[300px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={pieChartData.data} dataKey="value" nameKey="name" innerRadius={50}>
                                    {pieChartData.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}
             {categoryChart.data.length > 0 && categoryChart.config && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <FolderTree />
                            Projects by Category
                        </CardTitle>
                        <CardDescription>
                            A pie chart showing the distribution of projects by category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={categoryChart.config} className="min-h-[300px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={categoryChart.data} dataKey="value" nameKey="name" innerRadius={50}>
                                    {categoryChart.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}
           </div>
            {revitVersionChart.data.length > 0 && (
            <Card className="lg:col-span-2">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LineChart />
                    Revit Version by Category
                </CardTitle>
                <CardDescription>
                    A line chart showing the number of projects for each Revit version, grouped by category.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={revitVersionChart.config} className="min-h-[400px] w-full">
                    <RechartsPrimitive.LineChart data={revitVersionChart.data}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="revitVersion"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <YAxis />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {revitVersionChart.categories.map((category) => (
                        <RechartsPrimitive.Line
                        key={category}
                        dataKey={category}
                        type="monotone"
                        stroke={`var(--color-${category})`}
                        strokeWidth={2}
                        dot={false}
                        />
                    ))}
                    </RechartsPrimitive.LineChart>
                </ChartContainer>
                </CardContent>
            </Card>
            )}
        </div>
      </SidebarInset>
    </>
  );
}
