import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Camera, MapPin, Upload, Send, ThumbsUp, BadgeCheck, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import api from '@/services/api';

const BASE_URL = 'https://city-zen.onrender.com/';

const IncidentReporting = () => {
  const getEvidenceImageUrl = (evidenceUrl?: string, evidenceId?: string) => {
    if (evidenceUrl) return evidenceUrl;
    if (evidenceId) return `${BASE_URL}media/view/${evidenceId}`;
    return undefined;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    file: null as File | null,
    evidence_id: null,
  });
  const [reports, setReports] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [pendingLikeReportIds, setPendingLikeReportIds] = useState<number[]>([]);
  const [pendingVerifyReportIds, setPendingVerifyReportIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = [
    'Road Maintenance',
    'Street Lighting',
    'Waste Management',
    'Water Issues',
    'Public Safety',
    'Noise Complaint',
    'Environmental Concern',
    'Other'
  ];

  const fetchReports = async () => {
    setIsReportsLoading(true);
    try {
      const response = await api.get('/reports');
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData({ ...formData, file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, file: null });
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      location: '',
      file: null,
      evidence_id: null,
    });
    removeImage();
  }

  const handleSubmitReport = async () => {
    setIsSubmittingReport(true);

    const optimisticReport = {
      report_id: Date.now(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      status: 'Submitted',
      likes_count: 0,
      verifications_count: 0,
      created_at: new Date().toISOString(),
      evidence_id: null,
      evidence_url: imagePreview || undefined,
    };

    setReports(prev => [optimisticReport, ...prev]);

    let evidence_id = null;
    if (formData.file) {
      const imageData = new FormData();
      imageData.append('file', formData.file);
      try {
        const res = await api.post('/media/upload', imageData);
        evidence_id = res.data.picture_id;
      } catch (error) {
        console.error("Failed to upload image:", error);
        setReports(prev => prev.filter(report => report.report_id !== optimisticReport.report_id));
        setIsSubmittingReport(false);
        return;
      }
    }

    try {
      const reportData = { ...formData, evidence_id: evidence_id };
      const response = await api.post('/reports', reportData);
      if (response.data.success) {
        resetForm();
        setIsModalOpen(false);
        await fetchReports();
      } else {
        setReports(prev => prev.filter(report => report.report_id !== optimisticReport.report_id));
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
      setReports(prev => prev.filter(report => report.report_id !== optimisticReport.report_id));
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleLikeReport = async (reportId: number) => {
    if (pendingLikeReportIds.includes(reportId)) return;

    const originalReports = [...reports];
    const report = reports.find(item => item.report_id === reportId);
    if (!report) return;

    setPendingLikeReportIds(prev => [...prev, reportId]);
    setReports(prevReports => prevReports.map(item =>
      item.report_id === reportId
        ? {
            ...item,
            likes_count: (item.likes_count || 0) + 1,
          }
        : item
    ));

    try {
      const response = await api.post(`/reports/${reportId}/like`);
      if (response.data.success) {
        setReports(prevReports => prevReports.map(item =>
          item.report_id === reportId
            ? { ...item, likes_count: response.data.likes_count }
            : item
        ));
      }
    } catch (error) {
      console.error("Failed to like report:", error);
      setReports(originalReports);
    } finally {
      setPendingLikeReportIds(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleVerifyReport = async (reportId: number) => {
    if (pendingVerifyReportIds.includes(reportId)) return;

    const originalReports = [...reports];
    const report = reports.find(item => item.report_id === reportId);
    if (!report) return;

    setPendingVerifyReportIds(prev => [...prev, reportId]);
    setReports(prevReports => prevReports.map(item =>
      item.report_id === reportId
        ? {
            ...item,
            verifications_count: (item.verifications_count || 0) + 1,
          }
        : item
    ));

    try {
      const response = await api.post(`/reports/${reportId}/verify`);
      if (response.data.success) {
        setReports(prevReports => prevReports.map(item =>
          item.report_id === reportId
            ? { ...item, verifications_count: response.data.verifications_count }
            : item
        ));
      }
    } catch (error) {
      console.error("Failed to verify report:", error);
      setReports(originalReports);
    } finally {
      setPendingVerifyReportIds(prev => prev.filter(id => id !== reportId));
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
          className="text-center mb-8"
        >
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-eco">
            Incident Reports
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Help improve your community by reporting and verifying civic issues.
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button className="btn-eco text-lg py-6 px-8 rounded-full">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Report New Incident
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Camera className="w-5 h-5 text-primary" />
                            Submit New Report
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Form Content */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Incident Title</label>
                            <Input placeholder="Brief description of the issue" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                                <SelectTrigger><SelectValue placeholder="Select incident category" /></SelectTrigger>
                                <SelectContent>{categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Location</label>
                            <div className="flex gap-2">
                                <Input placeholder="Street address or description" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                                <Button variant="outline" size="icon"><MapPin className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Description</label>
                            <Textarea placeholder="Provide detailed information" rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Photo/Video Evidence</label>
                            {imagePreview ? (
                                <div className="relative"><img src={imagePreview} alt="Preview" className="rounded-lg w-full h-auto max-h-60 object-cover" /><Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={removeImage}><X className="h-4 w-4" /></Button></div>
                            ) : (
                                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">Click or drag file to upload</p>
                                    <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                            )}
                        </div>
                        <Button className="w-full btn-eco" onClick={handleSubmitReport} disabled={isSubmittingReport}>
                          <Send className="w-4 h-4 mr-2" />
                          {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {/* Reports & Score */}
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              <Card className="border-0 bg-gradient-primary text-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Your Reputation</h3>
                  <div className="text-2xl font-bold mb-1">850 Points</div>
                  <p className="text-sm opacity-90">Community Contributor</p>
                  <div className="mt-4 bg-white/20 rounded-full h-2"><div className="bg-white rounded-full h-2 w-4/5"></div></div>
                  <p className="text-xs mt-2 opacity-75">150 points to next level</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <Card className="border-0 bg-gradient-to-br from-card to-accent/10 shadow-lg">
                <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {isReportsLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    ))
                  ) : (
                    reports.map((report) => (
                    <div key={report.report_id} className="p-4 bg-muted/50 rounded-lg flex flex-col md:flex-row gap-4">
                        {/* Text content on the left */}
                        <div className="flex flex-col flex-grow">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">{report.title}</h4>
                                    <span className={`text-xs px-2 py-1 rounded ${report.status === 'AI Verified' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                        {report.status || "Submitted"}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Category:</span> {report.category}</p>
                                <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Description:</span> {report.description}</p>
                                <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Location:</span> {report.location}</p>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-2">
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 text-success hover:text-success/80 transition-colors" onClick={() => handleLikeReport(report.report_id)}>
                                        <ThumbsUp className="w-4 h-4" />
                                        <span className="text-sm">{report.likes_count}</span>
                                    </button>
                                    <button className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors" onClick={() => handleVerifyReport(report.report_id)}>
                                        <BadgeCheck className="w-4 h-4" />
                                        <span className="text-sm">{report.verifications_count || 0}</span>
                                    </button>
                                </div>
                                <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Image on the right (if it exists) */}
                        {(report.evidence_id || report.evidence_url) && (
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img 
                                    src={getEvidenceImageUrl(report.evidence_url, report.evidence_id)} 
                                    alt="Report" 
                                    className="rounded-lg w-full h-auto max-h-60 md:h-full md:max-h-none object-cover" 
                                />
                            </div>
                        )}
                    </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReporting;