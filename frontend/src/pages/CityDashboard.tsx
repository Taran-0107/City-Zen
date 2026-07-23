import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, BarChart3, TrendingUp, AlertTriangle, Users, Zap, Droplets, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Navigation from '@/components/Navigation';

const CityDashboard = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const incidentData = [
    { district: 'Downtown', incidents: 45, resolved: 38, pending: 7 },
    { district: 'Westside', incidents: 32, resolved: 28, pending: 4 },
    { district: 'Northfield', incidents: 28, resolved: 25, pending: 3 },
    { district: 'Eastpark', incidents: 41, resolved: 35, pending: 6 },
    { district: 'Southtown', incidents: 22, resolved: 20, pending: 2 }
  ];

  const trendData = [
    { month: 'Jan', incidents: 120, sustainability: 78, engagement: 65 },
    { month: 'Feb', incidents: 98, sustainability: 85, engagement: 72 },
    { month: 'Mar', incidents: 85, sustainability: 92, engagement: 78 },
    { month: 'Apr', incidents: 75, sustainability: 88, engagement: 85 },
    { month: 'May', incidents: 68, sustainability: 95, engagement: 90 },
    { month: 'Jun', incidents: 52, sustainability: 102, engagement: 95 }
  ];

  const resourceData = [
    { resource: 'Energy', consumption: 85, target: 75, trend: 'down' },
    { resource: 'Water', consumption: 78, target: 70, trend: 'down' },
    { resource: 'Waste', consumption: 92, target: 80, trend: 'up' },
    { resource: 'Transport', consumption: 88, target: 85, trend: 'stable' }
  ];

  const sentimentData = [
    { name: 'Positive', value: 65, color: '#28a745' },
    { name: 'Neutral', value: 25, color: '#6c757d' },
    { name: 'Negative', value: 10, color: '#dc3545' }
  ];

  const predictiveInsights = [
    {
      title: 'Road Maintenance Hotspots',
      prediction: 'Based on weather patterns and traffic data, expect 15% increase in pothole reports in downtown area next week.',
      confidence: 87,
      action: 'Deploy maintenance crew proactively'
    },
    {
      title: 'Energy Peak Demand',
      prediction: 'Summer heat wave will increase energy consumption by 25% in residential areas.',
      confidence: 92,
      action: 'Activate demand response programs'
    },
    {
      title: 'Community Engagement',
      prediction: 'New sustainability initiative likely to see 40% participation based on similar programs.',
      confidence: 78,
      action: 'Increase outreach in low-engagement areas'
    }
  ];

  const liveMetrics = {
    totalIncidents: 168,
    resolvedToday: 23,
    activeCitizens: 1247,
    sustainabilityScore: 85,
    co2Reduction: 15600,
    energySaved: 28
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-between items-center mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-eco">
              City Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Real-time insights and analytics for smarter city management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                <SelectItem value="downtown">Downtown</SelectItem>
                <SelectItem value="westside">Westside</SelectItem>
                <SelectItem value="northfield">Northfield</SelectItem>
                <SelectItem value="eastpark">Eastpark</SelectItem>
                <SelectItem value="southtown">Southtown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          {[
            { label: 'Total Incidents', value: liveMetrics.totalIncidents, icon: AlertTriangle, color: 'text-red-500' },
            { label: 'Resolved Today', value: liveMetrics.resolvedToday, icon: TrendingUp, color: 'text-green-500' },
            { label: 'Active Citizens', value: liveMetrics.activeCitizens.toLocaleString(), icon: Users, color: 'text-blue-500' },
            { label: 'Sustainability Score', value: `${liveMetrics.sustainabilityScore}%`, icon: Leaf, color: 'text-primary' },
            { label: 'CO₂ Reduced (kg)', value: liveMetrics.co2Reduction.toLocaleString(), icon: TrendingUp, color: 'text-green-600' },
            { label: 'Energy Saved (%)', value: `${liveMetrics.energySaved}%`, icon: Zap, color: 'text-yellow-500' }
          ].map((metric, index) => (
            <motion.div key={index} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                    <span className="text-lg font-bold">{metric.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Incident Heatmap */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Incident Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground">Interactive City Map</p>
                      <p className="text-sm text-muted-foreground">Showing incident clusters and severity</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {incidentData.map((district) => (
                      <div key={district.district} className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-medium text-sm">{district.district}</div>
                        <div className="text-xs text-muted-foreground">{district.incidents} incidents</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trends and Analytics */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-secondary" />
                    City Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="trends" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="trends">Trends</TabsTrigger>
                      <TabsTrigger value="incidents">Incidents</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="trends" className="mt-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="incidents" stroke="#dc3545" strokeWidth={2} name="Incidents" />
                          <Line type="monotone" dataKey="sustainability" stroke="#28a745" strokeWidth={2} name="Sustainability" />
                          <Line type="monotone" dataKey="engagement" stroke="#007bff" strokeWidth={2} name="Engagement" />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="incidents" className="mt-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incidentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="district" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="resolved" fill="#28a745" name="Resolved" />
                          <Bar dataKey="pending" fill="#ffc107" name="Pending" />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="resources" className="mt-6">
                      <div className="space-y-4">
                        {resourceData.map((resource) => (
                          <div key={resource.resource} className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{resource.resource}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{resource.consumption}%</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  resource.trend === 'down' ? 'bg-green-100 text-green-700' :
                                  resource.trend === 'up' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {resource.trend}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary rounded-full h-2"
                                style={{ width: `${resource.consumption}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Target: {resource.target}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sentiment Analysis */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardHeader>
                  <CardTitle>Community Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {sentimentData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Predictive Analytics */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="border-0 bg-gradient-warning text-warning-foreground">
                <CardHeader>
                  <CardTitle>Predictive Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {predictiveInsights.map((insight, index) => (
                    <div key={index} className="p-3 bg-black/10 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs opacity-90 mb-2">{insight.prediction}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Confidence: {insight.confidence}%</span>
                        <Button size="sm" variant="outline" className="text-xs h-6">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full btn-eco" size="sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Create Alert
                  </Button>
                  <Button className="w-full btn-sky" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityDashboard;
