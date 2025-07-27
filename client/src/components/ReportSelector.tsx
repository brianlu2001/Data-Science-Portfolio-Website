import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Search, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface ReportSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

// Available reports from your current /reports/ folder
const AVAILABLE_REPORTS = [
  // HTML Reports
  {
    filename: "Compressed-Sensing-and-Basis-Pursuit.html",
    url: "/reports/Compressed-Sensing-and-Basis-Pursuit.html",
    type: "html",
    displayName: "Compressed Sensing and Basis Pursuit"
  },
  {
    filename: "ITRI-ML-project-no-time - Machine Learning Predicting Success of Startups.html",
    url: "/reports/ITRI-ML-project-no-time - Machine Learning Predicting Success of Startups.html",
    type: "html",
    displayName: "ITRI ML - Machine Learning Predicting Success of Startups"
  },
  {
    filename: "NBA_salary_linear_regression - Linear Regression NBA Salary Inference.html",
    url: "/reports/NBA_salary_linear_regression - Linear Regression NBA Salary Inference.html",
    type: "html",
    displayName: "NBA Salary Linear Regression Analysis"
  },
  {
    filename: "PSTAT-131-Final-Project - Machine Learning Predicting Spotify Hits.html",
    url: "/reports/PSTAT-131-Final-Project - Machine Learning Predicting Spotify Hits.html",
    type: "html",
    displayName: "PSTAT 131 - Machine Learning Predicting Spotify Hits"
  },
  {
    filename: "PSTAT-134-final-project-Group-1 - Recommender Systems with Collaborative Filtering Recommending Movies.html",
    url: "/reports/PSTAT-134-final-project-Group-1 - Recommender Systems with Collaborative Filtering Recommending Movies.html",
    type: "html",
    displayName: "PSTAT 134 - Recommender Systems with Collaborative Filtering"
  },
  {
    filename: "PSTAT-174-Final-Project - Time Series SPX Stock Price.html",
    url: "/reports/PSTAT-174-Final-Project - Time Series SPX Stock Price.html",
    type: "html",
    displayName: "PSTAT 174 - Time Series SPX Stock Price Analysis"
  },
  
  // PDF Reports
  {
    filename: "Evolution of machine learning in financial risk management_A survey.pdf",
    url: "/reports/Evolution of machine learning in financial risk management_A survey.pdf",
    type: "pdf",
    displayName: "Evolution of Machine Learning in Financial Risk Management Survey"
  },
  {
    filename: "NLP Final Project Report - Natural Language Processing Book Review Analysis with BERT.pdf",
    url: "/reports/NLP Final Project Report - Natural Language Processing Book Review Analysis with BERT.pdf",
    type: "pdf",
    displayName: "NLP Final Project - Book Review Analysis with BERT"
  },
  {
    filename: "Recommender Systems with Deep Learning - Matrix Factorization.pdf",
    url: "/reports/Recommender Systems with Deep Learning - Matrix Factorization.pdf",
    type: "pdf",
    displayName: "Recommender Systems with Deep Learning - Matrix Factorization"
  },
  {
    filename: "Team Sound Ethics - Machine Learning AI Music Detection with Deep Learning.pdf",
    url: "/reports/Team Sound Ethics - Machine Learning AI Music Detection with Deep Learning.pdf",
    type: "pdf",
    displayName: "Team Sound Ethics - AI Music Detection with Deep Learning"
  }
];

export default function ReportSelector({ value, onChange }: ReportSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Find the current selection
  const selectedReport = AVAILABLE_REPORTS.find(report => report.url === value);

  // Filter reports based on search
  const filteredReports = useMemo(() => {
    if (!searchValue) return AVAILABLE_REPORTS;
    
    const search = searchValue.toLowerCase();
    return AVAILABLE_REPORTS.filter(report =>
      report.displayName.toLowerCase().includes(search) ||
      report.filename.toLowerCase().includes(search)
    );
  }, [searchValue]);

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
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedReport ? (
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
              {filteredReports.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  No reports found.
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
        </Command>
      </PopoverContent>
    </Popover>
  );
} 