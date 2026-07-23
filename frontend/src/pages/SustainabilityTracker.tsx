import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Upload, Zap, Droplets, Leaf, Trophy, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Navigation from '@/components/Navigation';
import { useRef } from 'react';
import { Input } from '@/components/ui/input';


const SustainabilityTracker = () => {
  // Memoize static data to prevent re-renders
  const monthlyData = useMemo(() => [
    { month: 'Jan', electricity: 320, water: 150, cost: 180 },
    { month: 'Feb', electricity: 280, water: 140, cost: 160 },
    { month: 'Mar', electricity: 300, water: 145, cost: 170 },
    { month: 'Apr', electricity: 260, water: 135, cost: 150 },
    { month: 'May', electricity: 240, water: 130, cost: 140 },
    { month: 'Jun', electricity: 220, water: 125, cost: 130 },
  ], []);

  const carbonData = useMemo(() => [
    { month: 'Jan', carbon: 450 },
    { month: 'Feb', carbon: 420 },
    { month: 'Mar', carbon: 390 },
    { month: 'Apr', carbon: 360 },
    { month: 'May', carbon: 330 },
    { month: 'Jun', carbon: 310 },
  ], []);

  const badges = [
    { name: 'Energy Saver', icon: Zap, color: 'text-yellow-500', earned: true },
    { name: 'Water Warrior', icon: Droplets, color: 'text-blue-500', earned: true },
    { name: 'Carbon Cutter', icon: Leaf, color: 'text-green-500', earned: false },
    { name: 'Eco Champion', icon: Trophy, color: 'text-purple-500', earned: false },
  ];

  const leaderboard = [
    { rank: 1, name: 'Sarah M.', points: 2450, reduction: '35%' },
    { rank: 2, name: 'You', points: 1890, reduction: '28%' },
    { rank: 3, name: 'Mike R.', points: 1670, reduction: '25%' },
    { rank: 4, name: 'Emma K.', points: 1520, reduction: '22%' },
    { rank: 5, name: 'Alex P.', points: 1340, reduction: '18%' },
  ];

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setUploadedFileName(file.name);
      }
  };

  const handleUploadButtonClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-eco">
            Sustainability Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor your environmental impact and track your progress towards a greener lifestyle.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: Zap, title: 'Energy Saved', value: '25%', color: 'text-yellow-500' },
            { icon: Droplets, title: 'Water Conserved', value: '18%', color: 'text-blue-500' },
            { icon: Leaf, title: 'Carbon Reduced', value: '310kg', color: 'text-green-500' },
            { icon: TrendingDown, title: 'Cost Savings', value: '₹12000', color: 'text-purple-500' },
          ].map((stat, index) => (
            <motion.div key={index} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardContent className="p-6 text-center">
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upload Bills */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Upload Utility Bills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={handleUploadButtonClick}
                    >
                      {/* Hidden file input is now controlled by the ref */}
                      <Input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                      />

                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium mb-2">
                        {uploadedFileName ? `File Selected: ${uploadedFileName}` : "Upload your utility bills"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {uploadedFileName ? "Click again to choose a different file." : "We'll extract data using OCR and calculate your consumption"}
                      </p>
                      
                      {/* This button now triggers the hidden input */}
                      <Button className="btn-eco" onClick={handleUploadButtonClick}>
                        Choose Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Charts */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle>Consumption Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="consumption" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="consumption">Monthly Consumption</TabsTrigger>
                        <TabsTrigger value="carbon">Carbon Footprint</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="consumption" className="mt-6">
                        <div style={{ width: '100%', height: '300px' }}>
                          <ResponsiveContainer>
                            <BarChart data={monthlyData} key="consumption-chart">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="electricity" fill="hsl(var(--primary))" name="Electricity (kWh)" />
                              <Bar dataKey="water" fill="hsl(var(--secondary))" name="Water (gallons)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="carbon" className="mt-6">
                        <div style={{ width: '100%', height: '300px' }}>
                          <ResponsiveContainer>
                            <LineChart data={carbonData} key="carbon-chart">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="carbon" stroke="hsl(var(--primary))" strokeWidth={3} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle>Achievement Badges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {badges.map((badge, index) => (
                      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                        badge.earned ? 'bg-primary/10' : 'bg-muted/50 opacity-50'
                      }`}>
                        <badge.icon className={`w-6 h-6 ${badge.color}`} />
                        <span className="font-medium">{badge.name}</span>
                        {badge.earned && <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">Earned</span>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-secondary text-white">
                  <CardHeader>
                    <CardTitle>Neighborhood Leaderboard</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        user.name === 'You' ? 'bg-white/20' : 'bg-white/10'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{user.rank}</span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{user.points}pts</div>
                          <div className="text-xs opacity-75">{user.reduction} reduction</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Progress Goals */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle>Monthly Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Energy Reduction</span>
                        <span className="text-sm">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Water Conservation</span>
                        <span className="text-sm">60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Carbon Footprint</span>
                        <span className="text-sm">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityTracker;