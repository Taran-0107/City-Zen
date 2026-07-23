import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Gift, Zap, Droplets, Leaf, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';

const Gamification = () => {
  const userLevel = 12;
  const currentXP = 2450;
  const nextLevelXP = 3000;

  const badges = [
    { 
      id: 1, 
      name: 'First Report', 
      description: 'Submit your first incident report',
      icon: Target,
      earned: true,
      rarity: 'common',
      date: '2024-01-15'
    },
    { 
      id: 2, 
      name: 'Energy Saver', 
      description: 'Reduce energy consumption by 20%',
      icon: Zap,
      earned: true,
      rarity: 'rare',
      date: '2024-02-20'
    },
    { 
      id: 3, 
      name: 'Water Guardian', 
      description: 'Save 500 gallons of water',
      icon: Droplets,
      earned: true,
      rarity: 'epic',
      date: '2024-03-10'
    },
    { 
      id: 4, 
      name: 'Eco Champion', 
      description: 'Complete 50 sustainability actions',
      icon: Leaf,
      earned: false,
      rarity: 'legendary',
      progress: 32
    },
    { 
      id: 5, 
      name: 'Community Leader', 
      description: 'Help organize 5 community events',
      icon: Users,
      earned: false,
      rarity: 'epic',
      progress: 2
    }
  ];

  const leaderboards = {
    city: [
      { rank: 1, name: 'Sarah Chen', points: 15420, level: 18, badge: 'Eco Master' },
      { rank: 2, name: 'You', points: 12890, level: 12, badge: 'Green Warrior' },
      { rank: 3, name: 'Mike Rodriguez', points: 11760, level: 14, badge: 'Sustainability Pro' },
      { rank: 4, name: 'Emma Wilson', points: 10230, level: 11, badge: 'Earth Guardian' },
      { rank: 5, name: 'Alex Johnson', points: 9850, level: 13, badge: 'Eco Advocate' }
    ],
    neighborhood: [
      { rank: 1, name: 'You', points: 12890, level: 12, badge: 'Green Warrior' },
      { rank: 2, name: 'Lisa Park', points: 8960, level: 10, badge: 'Eco Friend' },
      { rank: 3, name: 'Tom Davis', points: 7830, level: 9, badge: 'Planet Helper' },
      { rank: 4, name: 'Anna Kim', points: 6750, level: 8, badge: 'Green Starter' },
      { rank: 5, name: 'John Smith', points: 5920, level: 7, badge: 'Eco Newbie' }
    ],
    category: [
      { category: 'Energy Saving', points: 4250, rank: 2 },
      { category: 'Incident Reporting', points: 3890, rank: 1 },
      { category: 'Community Events', points: 2840, rank: 3 },
      { category: 'Water Conservation', points: 1910, rank: 4 }
    ]
  };

  const rewards = [
    {
      id: 1,
      title: 'Eco-Friendly Water Bottle',
      cost: 500,
      category: 'Lifestyle',
      image: '/placeholder.svg',
      available: true
    },
    {
      id: 2,
      title: 'Solar Power Bank',
      cost: 1200,
      category: 'Tech',
      image: '/placeholder.svg',
      available: true
    },
    {
      id: 3,
      title: 'Organic Coffee Subscription',
      cost: 800,
      category: 'Food',
      image: '/placeholder.svg',
      available: true
    },
    {
      id: 4,
      title: 'Electric Bike Voucher',
      cost: 3500,
      category: 'Transport',
      image: '/placeholder.svg',
      available: false
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100';
      case 'rare': return 'bg-blue-100';
      case 'epic': return 'bg-purple-100';
      case 'legendary': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
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
          <Trophy className="w-16 h-16 mx-auto mb-4 text-warning" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-eco">
            Rewards & Achievements
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Level up your civic engagement and earn rewards for making your community greener.
          </p>
        </motion.div>

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="border-0 bg-gradient-primary text-white">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">Level {userLevel}</div>
                    <div className="text-sm opacity-90">Current Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{currentXP.toLocaleString()}</div>
                    <div className="text-sm opacity-90">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{badges.filter(b => b.earned).length}</div>
                    <div className="text-sm opacity-90">Badges Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">2nd</div>
                    <div className="text-sm opacity-90">City Ranking</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm opacity-90">Progress to Level {userLevel + 1}</span>
                    <span className="text-sm opacity-90">{currentXP} / {nextLevelXP} XP</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Medal className="w-5 h-5 text-warning" />
                      Achievement Badges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {badges.map((badge) => (
                        <motion.div
                          key={badge.id}
                          className={`p-4 rounded-lg border-2 ${
                            badge.earned 
                              ? `${getRarityBg(badge.rarity)} border-current ${getRarityColor(badge.rarity)}` 
                              : 'bg-muted/50 border-muted opacity-50'
                          }`}
                          whileHover={{ scale: badge.earned ? 1.02 : 1 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${badge.earned ? 'bg-white/50' : 'bg-muted'}`}>
                              <badge.icon className={`w-6 h-6 ${badge.earned ? getRarityColor(badge.rarity) : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{badge.name}</h4>
                                <Badge variant="outline" className={`text-xs ${getRarityColor(badge.rarity)}`}>
                                  {badge.rarity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                              
                              {badge.earned ? (
                                <span className="text-xs text-success">Earned on {badge.date}</span>
                              ) : badge.progress !== undefined ? (
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs">Progress</span>
                                    <span className="text-xs">{badge.progress}/50</span>
                                  </div>
                                  <Progress value={(badge.progress / 50) * 100} className="h-1" />
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not started</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Rewards Store */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-secondary" />
                      Rewards Store
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {rewards.map((reward) => (
                        <div key={reward.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="bg-muted rounded-lg h-32 mb-3 flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">Product Image</span>
                          </div>
                          <h4 className="font-medium mb-1">{reward.title}</h4>
                          <Badge variant="secondary" className="text-xs mb-2">{reward.category}</Badge>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-primary">{reward.cost} points</span>
                            <Button 
                              size="sm" 
                              disabled={!reward.available || currentXP < reward.cost}
                              className="btn-eco"
                            >
                              {currentXP >= reward.cost ? 'Redeem' : 'Need More Points'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>

          {/* Leaderboards */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-warning" />
                      Leaderboards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="city" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="city">City</TabsTrigger>
                        <TabsTrigger value="neighborhood">Area</TabsTrigger>
                        <TabsTrigger value="category">Category</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="city" className="mt-4 space-y-3">
                        {leaderboards.city.map((user, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              user.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              user.rank === 1 ? 'bg-yellow-500 text-white' :
                              user.rank === 2 ? 'bg-gray-400 text-white' :
                              user.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted'
                            }`}>
                              {user.rank}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">Level {user.level} • {user.badge}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{user.points.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">points</div>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="neighborhood" className="mt-4 space-y-3">
                        {leaderboards.neighborhood.map((user, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              user.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              user.rank === 1 ? 'bg-yellow-500 text-white' :
                              user.rank === 2 ? 'bg-gray-400 text-white' :
                              user.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted'
                            }`}>
                              {user.rank}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">Level {user.level} • {user.badge}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{user.points.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">points</div>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="category" className="mt-4 space-y-3">
                        {leaderboards.category.map((cat, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <div className="font-medium">{cat.category}</div>
                              <div className="text-xs text-muted-foreground">Rank #{cat.rank}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{cat.points}</div>
                              <div className="text-xs text-muted-foreground">points</div>
                            </div>
                          </div>
                        ))}
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

export default Gamification;
