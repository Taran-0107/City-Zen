import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Heart, Share, ShoppingBag, Camera, MapPin, Calendar, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import api from '@/services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://city-zen.onrender.com/';

const Community = () => {
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const getAvatarUrl = (profilePictureUrl?: string, profilePictureId?: string) => {
    if (profilePictureUrl) return profilePictureUrl;
    if (profilePictureId) return `${BASE_URL}media/view/${profilePictureId}`;
    return undefined;
  };

  const getPostMediaUrl = (mediaUrl?: string, mediaId?: string) => {
    if (mediaUrl) return mediaUrl;
    if (mediaId) return `${BASE_URL}media/view/${mediaId}`;
    return undefined;
  };
  const [newComment, setNewComment] = useState('');
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingLikePostIds, setPendingLikePostIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setIsPostsLoading(true);
    try {
      const response = await api.get('/posts');
      if (response.data.success) {
        const formattedPosts = response.data.posts.map((post: any) => ({
          ...post,
          user_liked: post.user_liked,
          showComments: false,
          comments: [],
        }));
        setFeedPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setNewPostFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewPostFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostFile) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticPost = {
      post_id: optimisticId,
      content: newPostContent,
      media_url: imagePreview || undefined,
      media_id: undefined,
      user_liked: false,
      likes_count: 0,
      comments: [],
      showComments: false,
      created_at: new Date().toISOString(),
      user: {
        name: 'You',
        profile_picture_url: undefined,
      },
    };

    setFeedPosts(prev => [optimisticPost, ...prev]);
    setIsCreatingPost(true);
    setNewPostContent('');
    removeImage();

    let media_id = null;
    if (newPostFile) {
      const imageData = new FormData();
      imageData.append('file', newPostFile);
      try {
        const res = await api.post('/media/upload', imageData);
        media_id = res.data.picture_id;
      } catch (error) {
        console.error("Failed to upload image:", error);
        setFeedPosts(prev => prev.filter(post => post.post_id !== optimisticId));
        setIsCreatingPost(false);
        return;
      }
    }
    
    try {
      const response = await api.post('/posts', {
        content: newPostContent,
        media_id: media_id
      });
      if (response.data.success) {
        const serverPost = response.data.post || response.data;
        setFeedPosts(prev => prev.map(post =>
          post.post_id === optimisticId
            ? {
                ...post,
                ...serverPost,
                post_id: serverPost.post_id || optimisticId,
                user_liked: serverPost.user_liked ?? false,
                likes_count: serverPost.likes_count ?? 0,
                comments: [],
                showComments: false,
              }
            : post
        ));
      } else {
        setFeedPosts(prev => prev.filter(post => post.post_id !== optimisticId));
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      setFeedPosts(prev => prev.filter(post => post.post_id !== optimisticId));
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (pendingLikePostIds.includes(postId)) return;

    const originalPosts = [...feedPosts];
    const post = feedPosts.find(item => item.post_id === postId);
    if (!post) return;

    setPendingLikePostIds(prev => [...prev, postId]);
    setFeedPosts(prevPosts => prevPosts.map(item =>
      item.post_id === postId
        ? {
            ...item,
            likes_count: item.user_liked ? Math.max(0, (item.likes_count || 0) - 1) : (item.likes_count || 0) + 1,
            user_liked: !item.user_liked,
          }
        : item
    ));

    try {
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error("Failed to like post:", error);
      setFeedPosts(originalPosts);
    } finally {
      setPendingLikePostIds(prev => prev.filter(id => id !== postId));
    }
  };

  const toggleComments = async (postId: string) => {
    const postIndex = feedPosts.findIndex(p => p.post_id === postId);
    if (postIndex === -1) return;

    const updatedPosts = [...feedPosts];
    const postToUpdate = updatedPosts[postIndex];

    if (!postToUpdate.showComments) {
      try {
        const response = await api.get(`/posts/${postToUpdate.post_id}/comments`);
        if (response.data.success) {
          postToUpdate.comments = response.data.comments;
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    }
    postToUpdate.showComments = !postToUpdate.showComments;
    setFeedPosts(updatedPosts);
  };


  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text: newComment });
      if (response.data.success) {
        setNewComment('');
        // Refetch comments for the post to show the new one
        const postIndex = feedPosts.findIndex(p => p.post_id === postId);
        if (postIndex !== -1) {
          const updatedPosts = [...feedPosts];
          const postToUpdate = updatedPosts[postIndex];
          try {
            const commentsResponse = await api.get(`/posts/${postToUpdate.post_id}/comments`);
            if (commentsResponse.data.success) {
              postToUpdate.comments = commentsResponse.data.comments;
              // Make sure comments stay visible
              postToUpdate.showComments = true;
              setFeedPosts(updatedPosts);
            }
          } catch (error) {
            console.error("Failed to fetch comments:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };


  const marketplaceItems = [
    {
      id: 1,
      title: 'Solar Panel Installation',
      provider: 'GreenTech Solutions',
      price: '₹24,999',
      rating: 4.8,
      eco: true
    },
    {
      id: 2,
      title: 'Organic Vegetable Box',
      provider: 'Local Farm Co-op',
      price: '₹350/week',
      rating: 4.9,
      eco: true
    },
    {
      id: 3,
      title: 'Electric Bike Rental',
      provider: 'EcoRide',
      price: '₹150/day',
      rating: 4.6,
      eco: true
    }
  ];

  const events = [
    {
      id: 1,
      title: 'Oblivion Thinker Quest',
      date: 'Happening Now',
      location: 'NSUT Campus Grounds',
      attendees: 23
    },
    {
      id: 2,
      title: 'Sustainability Fair',
      date: 'This Saturday',
      location: 'City Hall Plaza',
      attendees: 157
    }
  ];

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
          <Users className="w-16 h-16 mx-auto mb-4 text-secondary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-eco">
            Community Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with neighbors, share experiences, and build a stronger, greener community together.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Post Creation */}
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Share something with your community..."
                          className="w-full p-3 bg-muted rounded-lg border-0 outline-none"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="relative mb-4">
                        <img src={imagePreview} alt="Preview" className="rounded-lg w-full h-auto max-h-60 object-cover" />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 rounded-full h-8 w-8"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <ImageIcon className="w-4 h-4 mr-1" />
                          Photo
                        </Button>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <Button variant="ghost" size="sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          Location
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={anonymousMode}
                            onChange={(e) => setAnonymousMode(e.target.checked)}
                          />
                          Anonymous
                        </label>
                        <Button className="btn-eco" onClick={handleCreatePost} disabled={isCreatingPost}>
                          {isCreatingPost ? 'Sharing...' : 'Share'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feed Posts */}
              <div className="space-y-6">
                {feedPosts.map((post, index) => (
                  <motion.div
                    key={post.post_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                      <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar>
                                <AvatarImage src={getAvatarUrl(post.user?.profile_picture_url, post.user?.profile_picture_id)} />
                                <AvatarFallback>{post.user?.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{post.user?.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {post.user?.location || "City-Zen"}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          <p className="mb-4">{post.content}</p>

                          {post.media_id && (
                            <div className="bg-muted rounded-lg h-auto mb-4 flex items-center justify-center">
                              <img src={getPostMediaUrl(post.media_url, post.media_id)} alt="Post media" className="rounded-lg max-h-96 w-full object-cover" />
                            </div>
                          )}

                          <div className="flex items-center gap-6 pt-4 border-t">
                            <button
                              className={`flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors ${post.user_liked ? 'text-red-500' : ''}`}
                              onClick={() => handleLikePost(post.post_id)}
                            >
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">{post.likes_count}</span>
                            </button>
                            <button
                              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => toggleComments(post.post_id)}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{post.comments_count}</span>
                            </button>
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors">
                              <Share className="w-4 h-4" />
                              <span className="text-sm">Share</span>
                            </button>
                          </div>
                          {post.showComments && (
                            <div className="mt-4">
                              <div className="max-h-96 overflow-y-auto">
                                {post.comments.map((comment: any) => (
                                  <div key={comment.comment_id} className="mb-2 p-2 border-b">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback>{comment.user?.name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <p className="font-semibold">{comment.user?.name}</p>
                                    </div>
                                    <p className="text-sm mt-1">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex w-full gap-2 mt-2">
                                <Input
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Add a comment..."
                                />
                                <Button onClick={() => handleAddComment(post.post_id)}>Post</Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="mt-6">
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                          Eco-Marketplace
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {marketplaceItems.map((item) => (
                          <div key={item.id} className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{item.title}</h4>
                              {item.eco && (
                                <Badge className="bg-success text-success-foreground">Eco-Friendly</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{item.provider}</p>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-primary">{item.price}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">⭐ {item.rating}</span>
                              </div>
                            </div>
                            <Button size="sm" className="w-full mt-3 btn-eco">
                              View Details
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-secondary" />
                          Upcoming Events
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">{event.title}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{event.location}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {event.attendees} attending
                              </span>
                              <Button size="sm" variant="outline">
                                Join Event
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 bg-gradient-primary text-white">
                  <CardHeader>
                    <CardTitle>Community Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">1,247</div>
                        <div className="text-sm opacity-90">Active Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">89</div>
                        <div className="text-sm opacity-90">Issues Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">15k</div>
                        <div className="text-sm opacity-90">CO2 Saved (kg)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">342</div>
                        <div className="text-sm opacity-90">Events Hosted</div>
                      </div>
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

export default Community;