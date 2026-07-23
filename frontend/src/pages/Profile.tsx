import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Shield, Bell, Eye, EyeOff, MapPin, Calendar, Award, Activity, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';

const BASE_URL = 'https://city-zen.onrender.com/';

const Profile = () => {
  const { user, updateUser } = useAuth(); // Changed from 'login' to 'updateUser'
  const [userStats, setUserStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const getProfileImageUrl = (profilePictureUrl?: string, profilePictureId?: string) => {
    if (profilePictureUrl) return profilePictureUrl;
    if (profilePictureId) return `${BASE_URL}media/view/${profilePictureId}`;
    return undefined;
  };
  const [achievements, setAchievements] = useState<any[]>([]);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [notifications, setNotifications] = useState({
    incidents: true,
    community: true,
    rewards: true,
    updates: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    if (user) {
      try {
        const res = await api.get('/auth/profile');
        setUserStats(res.data);
        // Use the new updateUser function to avoid redirection
        updateUser(res.data); 
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        await fetchProfile();

        api.get(`/reports?user_id=${user.user_id}`).then(res => {
            if (res.data && res.data.reports) {
                setRecentReports(res.data.reports.slice(0, 3));
            }
        });

        api.get('/rewards').then(res => {
            if(res.data && res.data.rewards) {
                const userBadges = user.badges || [];
                const allAchievements = res.data.rewards.map((reward: any) => ({
                    name: reward.title,
                    description: reward.description,
                    earned: userBadges.includes(reward.badge_name)
                }));
                setAchievements(allAchievements);
            }
        });
      }
    };
    fetchData();
  }, [user?.user_id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_type', 'profile'); // Specify the upload type

      try {
          // Corrected the upload endpoint
          const uploadRes = await api.post('/media/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (uploadRes.data.success) {
              await fetchProfile(); // Refresh profile data
          }
      } catch (error) {
          console.error('Failed to update profile picture:', error);
          alert('Error updating profile picture.');
      }
  };

  if (!userStats) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
            <Navigation />
            <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
                <Skeleton className="h-16 w-72 mx-auto" />
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <Skeleton className="h-72 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-72 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
  }
  
  // The entire return statement with JSX is the same as the previous response.
  // No changes are needed there.
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <User className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-eco">
            Your Profile
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track your civic contributions and manage your community impact.
          </p>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-primary text-white">
                  <CardContent className="p-8 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4 group">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={getProfileImageUrl(userStats.profile_picture_url, userStats.profile_picture_id)} alt={userStats.name}/>
                        <AvatarFallback className="text-2xl font-bold text-primary">
                          {userStats.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={handleAvatarClick} 
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{userStats.name}</h2>
                    <Badge className="mb-4 bg-white/20 text-white">
                      Level {userStats.level} Contributor
                    </Badge>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold">{userStats.points}</div>
                        <div className="text-sm opacity-90">Points</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{userStats.level}</div>
                        <div className="text-sm opacity-90">Level</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm opacity-90 mb-2">
                      <MapPin className="w-4 h-4" />
                      {userStats.location || 'City Dweller'}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(userStats.created_at).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-secondary" />
                      Your Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{userStats.followers_count}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-success">{userStats.following_count}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg col-span-2">
                      <div className="text-2xl font-bold text-info">{userStats.carbon_footprint_saved.toFixed(2)} kg</div>
                      <div className="text-xs text-muted-foreground">CO₂ Saved</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardContent className="p-8">
                    <Tabs defaultValue="activity" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="achievements">Achievements</TabsTrigger>
                        <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>
                      <TabsContent value="activity" className="mt-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
                            <div className="space-y-3">
                              {recentReports.length > 0 ? recentReports.map((report) => (
                                <div key={report.report_id} className="p-4 bg-muted/50 rounded-lg">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">{report.title}</h4>
                                    <Badge variant={"secondary"}>
                                      {report.status || "Submitted"}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                    <span>{report.likes_count} upvotes</span>
                                  </div>
                                </div>
                              )) : <p>No reports found.</p>}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="achievements" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold mb-4">Your Achievements</h3>
                          {achievements.length > 0 ? achievements.map((achievement, index) => (
                            <div 
                              key={index} 
                              className={`p-4 rounded-lg border ${
                                achievement.earned 
                                  ? 'bg-success/10 border-success/20' 
                                  : 'bg-muted/50 border-muted opacity-70'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Award className={`w-6 h-6 mt-1 ${
                                  achievement.earned ? 'text-success' : 'text-muted-foreground'
                                }`} />
                                <div className="flex-1">
                                  <h4 className="font-medium">{achievement.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                                  {achievement.earned && <Badge className="bg-success text-success-foreground">Earned</Badge>}
                                </div>
                              </div>
                            </div>
                          )) : <p>No achievements yet.</p>}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="sustainability" className="mt-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Sustainability Progress</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                               <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold text-success mb-1">{userStats.carbon_footprint_saved.toFixed(2)}kg</div>
                                <div className="text-sm text-muted-foreground">CO₂ Reduced</div>
                              </div>
                              <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold text-primary mb-1">85%</div>
                                <div className="text-sm text-muted-foreground">Current Score</div>
                              </div>
                            </div>
                            
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-3">6-Month Trend</h4>
                              <div className="flex items-end justify-between h-32">
                                {/* This data is still mocked as there is no backend endpoint for it */}
                                {[ { month: 'Jan', score: 65 }, { month: 'Feb', score: 72 }, { month: 'Mar', score: 78 }, { month: 'Apr', score: 81 }, { month: 'May', score: 85 }, { month: 'Jun', score: 85 } ].map((month, index) => (
                                  <div key={index} className="flex flex-col items-center">
                                    <div 
                                      className="bg-primary rounded-t w-8 mb-2"
                                      style={{ height: `${month.score}%` }}
                                    />
                                    <span className="text-xs text-muted-foreground">{month.month}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="settings" className="mt-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="name">Full Name</Label>
                                  <Input id="name" defaultValue={userStats.name} />
                                </div>
                                <div>
                                  <Label htmlFor="email">Email</Label>
                                  <Input id="email" defaultValue={userStats.email} readOnly />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {anonymousMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  <Label>Anonymous Mode</Label>
                                </div>
                                <Switch 
                                  checked={anonymousMode}
                                  onCheckedChange={setAnonymousMode}
                                />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                When enabled, your name will be hidden in public posts and reports.
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                            <div className="space-y-4">
                              {Object.entries(notifications).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    <Label className="capitalize">{key} Notifications</Label>
                                  </div>
                                  <Switch 
                                    checked={value}
                                    onCheckedChange={(checked) => 
                                      setNotifications(prev => ({ ...prev, [key]: checked }))
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <Button className="btn-eco" onClick={() => alert('Update functionality is a work in progress!')}>Save Changes</Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
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

export default Profile;