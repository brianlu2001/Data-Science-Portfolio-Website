import React, { useState, useMemo, useEffect } from 'react';
import { Check, ChevronDown, Search, FileText, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface Report {
  filename: string;
  url: string;
  type: string;
  displayName: string;
}

interface ReportsManifest {
  reports: Report[];
  generatedAt: string;
  count: number;
}

interface ReportSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function ReportSelector({ value, onChange }: ReportSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports from API or manifest
  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try fetching from API first (works in local dev and Vercel)
        let response = await fetch('/api/reports');
        
        if (!response.ok) {
          // Fallback: try to fetch the static manifest directly
          response = await fetch('/reports-manifest.json');
        }
        
        if (response.ok) {
          const data: ReportsManifest = await response.json();
          setReports(data.reports || []);
        } else {
          throw new Error('Failed to load reports');
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please refresh the page.');
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchReports();
  }, []);

  // Find the current selection
  const selectedReport = reports.find(report => report.url === value);

  // Filter reports based on search
  const filteredReports = useMemo(() => {
    if (!searchValue) return reports;
    
    const search = searchValue.toLowerCase();
    return reports.filter(report =>
      report.displayName.toLowerCase().includes(search) ||
      report.filename.toLowerCase().includes(search)
    );
  }, [searchValue, reports]);

  const handleSelect = (reportUrl: string) => {
    onChange(reportUrl);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-charcoal-800 border-gray-600 text-white hover:bg-charcoal-700"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">Loading reports...</span>
              </>
            ) : selectedReport ? (
              <>
                {selectedReport.type === 'pdf' ? (
                  <File className="h-4 w-4 text-red-400 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                )}
                <span className="truncate text-left">{selectedReport.displayName}</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">Select a report...</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-charcoal-800 border-gray-600" align="start">
        <Command className="bg-charcoal-800">
          <div className="flex items-center border-b border-gray-600 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 bg-transparent text-white placeholder:text-gray-400 focus:ring-0"
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {error && (
              <div className="py-4 px-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}
            
            {value && (
              <div className="px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  Clear selection
                </Button>
              </div>
            )}
            
            <CommandGroup>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Loading reports...
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  {reports.length === 0 
                    ? "No reports found in /reports/ folder."
                    : "No reports match your search."}
                </div>
              ) : (
                filteredReports.map((report) => (
                  <CommandItem
                    key={report.url}
                    value={report.url}
                    onSelect={() => handleSelect(report.url)}
                    className="cursor-pointer text-white hover:bg-gray-700 aria-selected:bg-gray-700"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {report.type === 'pdf' ? (
                        <File className="h-4 w-4 text-red-400 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{report.displayName}</div>
                        <div className="text-xs text-gray-400 truncate">{report.filename}</div>
                      </div>
                      {value === report.url && (
                        <Check className="ml-2 h-4 w-4 text-royal-400 flex-shrink-0" />
                      )}
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </div>
          
          {!isLoading && reports.length > 0 && (
            <div className="border-t border-gray-600 px-3 py-2 text-xs text-gray-500">
              {reports.length} report{reports.length !== 1 ? 's' : ''} available
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
