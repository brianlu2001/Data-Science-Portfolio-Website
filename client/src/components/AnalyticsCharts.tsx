import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Eye, MousePointer, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

type TimeWindow = '7d' | '30d' | '90d' | '1y';
type ResolutionMode = 'daily' | 'weekly';

interface AnalyticsSummary {
  totalPageViews: number;
  totalProjectClicks: number;
  topProjects: { projectId: number; projectTitle: string; clicks: number }[];
  dailyStats: { date: string; pageViews: number; projectClicks: number }[];
}

interface AnalyticsChartsProps {
  className?: string;
}

export default function AnalyticsCharts({ className }: AnalyticsChartsProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode>('daily');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeWindow) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    setStartDate(start);
    setEndDate(end);

    // Set default resolution mode for longer time windows
    if (timeWindow === '90d' || timeWindow === '1y') {
      setResolutionMode('weekly');
    } else {
      setResolutionMode('daily');
    }
  }, [timeWindow]);

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsSummary>({
    queryKey: ['/api/analytics/summary', startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!(startDate && endDate),
  });

  // Aggregate daily data into weekly data
  const aggregateToWeekly = (dailyStats: { date: string; pageViews: number; projectClicks: number }[]) => {
    const weeklyStats = [];
    const weeks = Math.ceil(dailyStats.length / 7);
    
    for (let i = 0; i < weeks; i++) {
      const startIdx = i * 7;
      const endIdx = Math.min(startIdx + 7, dailyStats.length);
      const weekData = dailyStats.slice(startIdx, endIdx);
      
      if (weekData.length > 0) {
        const totalPageViews = weekData.reduce((sum, day) => sum + day.pageViews, 0);
        const totalProjectClicks = weekData.reduce((sum, day) => sum + day.projectClicks, 0);
        
        // Use the start date of the week
        const weekStartDate = weekData[0].date;
        const date = new Date(weekStartDate);
        const weekLabel = `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        weeklyStats.push({
          date: weekStartDate,
          weekLabel,
          pageViews: totalPageViews,
          projectClicks: totalProjectClicks,
        });
      }
    }
    
    return weeklyStats;
  };

  // Generate mock data for demonstration purposes
  const generateMockData = (timeWindow: TimeWindow): AnalyticsSummary => {
    const days = timeWindow === '7d' ? 7 : timeWindow === '30d' ? 30 : timeWindow === '90d' ? 90 : 365;
    const dailyStats = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic random data based on time window
      const basePageViews = timeWindow === '7d' ? 25 : timeWindow === '30d' ? 35 : timeWindow === '90d' ? 45 : 55;
      const baseProjectClicks = timeWindow === '7d' ? 12 : timeWindow === '30d' ? 18 : timeWindow === '90d' ? 25 : 30;
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        pageViews: Math.floor(Math.random() * basePageViews) + 10,
        projectClicks: Math.floor(Math.random() * baseProjectClicks) + 5,
      });
    }

    const totalPageViews = dailyStats.reduce((sum, day) => sum + day.pageViews, 0);
    const totalProjectClicks = dailyStats.reduce((sum, day) => sum + day.projectClicks, 0);

    const topProjects = [
      { projectId: 1, projectTitle: "AI Music Detection with Deep Learning", clicks: Math.floor(totalProjectClicks * 0.25) },
      { projectId: 2, projectTitle: "Time Series SPX Stock Price Analysis", clicks: Math.floor(totalProjectClicks * 0.20) },
      { projectId: 3, projectTitle: "Recommender Systems with Matrix Factorization", clicks: Math.floor(totalProjectClicks * 0.18) },
      { projectId: 4, projectTitle: "Machine Learning Predicting Spotify Hits", clicks: Math.floor(totalProjectClicks * 0.15) },
      { projectId: 5, projectTitle: "Startup Success Prediction with ML", clicks: Math.floor(totalProjectClicks * 0.12) },
    ].sort((a, b) => b.clicks - a.clicks); // Sort by clicks descending

    return {
      totalPageViews,
      totalProjectClicks,
      topProjects,
      dailyStats,
    };
  };

  // Use mock data if no real analytics data exists yet
  const rawData = analytics && (analytics.totalPageViews > 0 || analytics.totalProjectClicks > 0) 
    ? analytics 
    : generateMockData(timeWindow);

  // Determine if we should use weekly aggregation by default for longer time windows
  const shouldUseWeeklyByDefault = (timeWindow === '90d' || timeWindow === '1y') && resolutionMode === 'weekly';
  
  // Process data based on resolution mode
  const chartData = shouldUseWeeklyByDefault || (resolutionMode === 'weekly' && (timeWindow === '90d' || timeWindow === '1y'))
    ? aggregateToWeekly(rawData.dailyStats)
    : rawData.dailyStats;

  const displayData = {
    ...rawData,
    dailyStats: chartData,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatXAxisLabel = (value: any) => {
    // Handle weekly data format
    if (value && typeof value === 'object' && value.weekLabel) {
      return value.weekLabel;
    }
    // Handle regular date string
    if (typeof value === 'string') {
      return formatDate(value);
    }
    return value;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeWindowLabel = (window: TimeWindow) => {
    switch (window) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white suika-fallback">Analytics Dashboard</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select value={timeWindow} onValueChange={(value: TimeWindow) => setTimeWindow(value)}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => refetch()} 
              size="sm"
              className="bg-royal-500 hover:bg-royal-600 text-white w-full sm:w-auto"
            >
              <Clock size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-effect border-gray-600">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-4"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white suika-fallback">Analytics Dashboard</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Select value={timeWindow} onValueChange={(value: TimeWindow) => setTimeWindow(value)}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {(timeWindow === '90d' || timeWindow === '1y') && (
            <Select value={resolutionMode} onValueChange={(value: ResolutionMode) => setResolutionMode(value)}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button 
            onClick={() => refetch()} 
            size="sm"
            className="bg-royal-500 hover:bg-royal-600 text-white w-full sm:w-auto"
          >
            <Clock size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-effect border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Page Views</CardTitle>
              <Eye className="h-4 w-4 text-royal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatNumber(displayData?.totalPageViews || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">{getTimeWindowLabel(timeWindow)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass-effect border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Project Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-royal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatNumber(displayData?.totalProjectClicks || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">{getTimeWindowLabel(timeWindow)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-effect border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Click-through Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-royal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {displayData?.totalPageViews ? 
                  `${((displayData.totalProjectClicks / displayData.totalPageViews) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">Projects per page view</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full"
        >
          <Card className="glass-effect border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {resolutionMode === 'weekly' ? 'Weekly Traffic' : 'Daily Traffic'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayData?.dailyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey={resolutionMode === 'weekly' ? 'weekLabel' : 'date'}
                    tickFormatter={resolutionMode === 'weekly' ? undefined : formatDate}
                    stroke="#9CA3AF"
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Line 
                    type="linear" 
                    dataKey="pageViews" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Page Views"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="linear" 
                    dataKey="projectClicks" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Project Clicks"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full"
        >
          <Card className="glass-effect border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Top Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={displayData?.topProjects?.slice(0, 5) || []}
                  layout="vertical"
                  margin={{ left: 0, right: 5, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    type="number"
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="projectTitle" 
                    type="category"
                    stroke="#9CA3AF"
                    width={window.innerWidth < 640 ? 80 : 120}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 10 }}
                    tickFormatter={(value) => {
                      // More aggressive truncation for mobile
                      const maxLength = window.innerWidth < 640 ? 12 : 20;
                      return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value, name) => [value, 'Clicks']}
                    labelFormatter={(label) => label}
                  />
                  <Bar 
                    dataKey="clicks" 
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                    stroke="#2563EB"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}