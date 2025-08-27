'use client';

import { useState, createElement } from 'react';
import { MainNav } from '@/components/main-nav';
import { 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Wand2, Download } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getDatabase, ref, get } from 'firebase/database';
import { generateProjectReport } from '@/ai/flows/generate-project-report';
import type { GenerateProjectReportOutput } from '@/ai/flows/generate-project-report';

type ReportSection = GenerateProjectReportOutput['report'][0];

export default function ProjectReportPage() {
  const [report, setReport] = useState<ReportSection[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport(null);
    try {
      const db = getDatabase(app);
      const dataRef = ref(db, 'ProjectData'); // Updated from 'Models' to 'ProjectData' based on other pages
      const snapshot = await get(dataRef);

      if (!snapshot.exists()) {
        toast({
          title: 'No Data Found',
          description: 'Could not find any project data in Firebase to generate a report.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const data = snapshot.val();
      
      const { report: generatedReport } = await generateProjectReport({
        projectData: JSON.stringify(data),
      });

      setReport(generatedReport);
      toast({
        title: 'Report Generated',
        description: 'The project report has been successfully generated.',
      });

    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Generation Error',
        description: error.message || 'Could not generate the report. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!report) {
        toast({
            title: 'No Report to Export',
            description: 'Please generate a report first.',
            variant: 'destructive',
        });
        return;
    }

    const reportContent = report
      .map(section => {
        return `## ${section.title}\n\n${section.content}\n\n`;
      })
      .join('---\n\n');
      
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
        title: 'Report Exported',
        description: 'Your report has been downloaded.',
    });
  };

  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <FileText className="h-6 w-6 text-primary" />;
    
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return createElement(IconComponent, { className: 'h-6 w-6 text-primary' });
    }
    
    return <FileText className="h-6 w-6 text-primary" />;
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
                Project Report
              </h1>
              <p className="text-muted-foreground mt-2">
                Generate and view AI-powered reports for your projects.
              </p>
            </div>
          </header>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Report Generator</CardTitle>
              <CardDescription>
                Click the button below to generate a report from your project data using Gemini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                  <p className="mt-4 text-lg">Generating Report...</p>
                  <p>Please wait, this may take a moment.</p>
                </div>
              ) : report ? (
                 <div className="space-y-6">
                    {report.map((section, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            {renderIcon(section.icon)}
                            {section.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-4 text-lg">No report generated yet.</p>
                    <p>Click the button to start.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
                {report && (
                    <Button onClick={handleExportReport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                )}
                <Button onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}
