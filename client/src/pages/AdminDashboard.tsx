import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertProjectSchema, insertSiteSettingsSchema, type Project, type SiteSettings } from "@shared/schema";
import ImageUpload from "@/components/ImageUpload";
import DraggableProjectList from "@/components/DraggableProjectList";
import { type z } from "zod";
import { BarChart3, Users, Eye, MousePointer, Settings, LogOut, Plus, Upload, Edit2, Trash2, X, GripVertical } from "lucide-react";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import LoginForm from "@/components/LoginForm";

type InsertProjectData = z.infer<typeof insertProjectSchema>;
type InsertSiteSettingsData = z.infer<typeof insertSiteSettingsSchema>;

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // All hooks must be called before any conditional returns
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/projects-simple"],
    retry: 1,
    enabled: isAuthenticated, // Only run when authenticated
  });

  const { data: siteSettings, isLoading: settingsLoading, error: settingsError } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings-simple"],
    enabled: isAuthenticated,
  });

  // Log any API errors
  useEffect(() => {
    if (projectsError) {
      console.error('Projects API error:', projectsError);
    }
    if (settingsError) {
      console.error('Settings API error:', settingsError);
    }
  }, [projectsError, settingsError]);

  const projectForm = useForm<InsertProjectData>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      simplifiedDescription: "",
      fullDescription: "",
      technologies: [],
      category: "",
      imageUrl: "",
      projectUrl: "",
      githubUrl: "",
      sortOrder: 0,
    },
  });

  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const settingsForm = useForm<InsertSiteSettingsData>({
    resolver: zodResolver(insertSiteSettingsSchema),
    defaultValues: {
      contactEmail: siteSettings?.contactEmail || "",
      contactPhone: siteSettings?.contactPhone || "",
      linkedinUrl: siteSettings?.linkedinUrl || "",
      bio: siteSettings?.bio || "",
    },
  });

  // Update form values when siteSettings changes
  useEffect(() => {
    if (siteSettings) {
      settingsForm.reset({
        contactEmail: siteSettings.contactEmail || "",
        contactPhone: siteSettings.contactPhone || "",
        linkedinUrl: siteSettings.linkedinUrl || "",
        bio: siteSettings.bio || "",
      });
    }
  }, [siteSettings, settingsForm]);

  // ALL MUTATIONS MUST BE DEFINED BEFORE CONDITIONAL RETURNS
  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/projects-simple", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-simple"] });
      projectForm.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth?action=login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertProjectData }) => {
      const response = await apiRequest("PUT", `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-simple"] });
      // Update the form with the latest data instead of clearing it
      projectForm.reset({
        title: updatedProject.title,
        simplifiedDescription: updatedProject.simplifiedDescription || "",
        fullDescription: updatedProject.fullDescription || "",
        technologies: updatedProject.technologies || [],
        category: updatedProject.category || "",
        imageUrl: updatedProject.imageUrl || "",
        projectUrl: updatedProject.projectUrl || "",
        githubUrl: updatedProject.githubUrl || "",
        sortOrder: updatedProject.sortOrder,
      });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth?action=login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-simple"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
  });

  const updateProjectOrderMutation = useMutation({
    mutationFn: (projects: Project[]) => apiRequest("PUT", "/api/update-project-order", { projects }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-simple"] });
      toast({
        title: "Success",
        description: "Project order updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth?action=login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InsertSiteSettingsData) => {
      const response = await apiRequest("PUT", "/api/site-settings-simple", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings-simple"] });
      setIsEditingSettings(false);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth?action=login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Show loading while checking authentication
  if (isLoading) {
    console.log('AdminDashboard: Still loading auth...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('AdminDashboard: Not authenticated, showing login form');
    return <LoginForm onLoginSuccess={() => {
      console.log('Login successful, forcing component refresh...');
      // Force a small delay to ensure state is updated, then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }} />;
  }

  console.log('AdminDashboard: Authenticated, rendering main content');

  const handleProjectSubmit = (data: InsertProjectData) => {
    console.log("Form data received:", data);
    
    if (editingProject) {
      console.log("Updating project with JSON data");
      updateProjectMutation.mutate({ id: editingProject.id, data: data });
    } else {
      // For creation, use FormData for file uploads
      console.log("Creating project with FormData");
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const imageFile = (document.getElementById('project-image') as HTMLInputElement)?.files?.[0];
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      createProjectMutation.mutate(formData);
    }
  };

  const handleSettingsSubmit = (data: InsertSiteSettingsData) => {
    updateSettingsMutation.mutate(data);
    setIsEditingSettings(false);
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    projectForm.reset({
      title: project.title,
      simplifiedDescription: project.simplifiedDescription || "",
      fullDescription: project.fullDescription || "",
      technologies: project.technologies || [],
      category: project.category || "",
      imageUrl: project.imageUrl || "",
      projectUrl: project.projectUrl || "",
      githubUrl: project.githubUrl || "",
      sortOrder: project.sortOrder,
    });
  };

  const cancelEditing = () => {
    setEditingProject(null);
    // Reset form to empty state for new project creation
    projectForm.reset({
      title: "",
      simplifiedDescription: "",
      fullDescription: "",
      technologies: [],
      category: "",
      imageUrl: "",
      projectUrl: "",
      githubUrl: "",
      sortOrder: 0,
    });
  };

  const handleProjectReorder = (reorderedProjects: Project[]) => {
    // Optimistically update the UI
    queryClient.setQueryData(["/api/projects-simple"], reorderedProjects);
    
    // Save to backend
    updateProjectOrderMutation.mutate(reorderedProjects);
  };

  const handleDeleteProject = (id: string) => {
    deleteProjectMutation.mutate(parseInt(id));
  };

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="suika-fallback text-2xl sm:text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="glass-effect border-gray-600 text-gray-300 hover:text-white"
            >
              View Portfolio
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/auth?action=logout"}
              className="glass-effect border-gray-600 text-gray-300 hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="glass-effect border-gray-600">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">Site Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Card className="glass-effect border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {editingProject ? <Edit2 size={20} /> : <Plus size={20} />}
                  {editingProject ? "Edit Project" : "Add New Project"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...projectForm}>
                  <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Project Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-charcoal-800 border-gray-600 text-white"
                                placeholder="Enter project title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="technologies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Technologies</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value.split(',').map(item => item.trim()).filter(item => item));
                                }}
                                className="bg-charcoal-800 border-gray-600 text-white"
                                placeholder="Machine Learning, Python, TensorFlow, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Category</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-charcoal-800 border-gray-600 text-white"
                                placeholder="Machine Learning, Data Science, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    


                    <FormField
                      control={projectForm.control}
                      name="simplifiedDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Simplified Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-charcoal-800 border-gray-600 text-white"
                              rows={8}
                              placeholder="Brief description for dropdown preview..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={projectForm.control}
                      name="fullDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Full Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-charcoal-800 border-gray-600 text-white"
                              rows={12}
                              placeholder="Complete detailed description for project page..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormField
                          control={projectForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                                                <ImageUpload
                                   value={field.value || ""}
                                   onChange={field.onChange}
                                   label="Project Image"
                                 />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={projectForm.control}
                          name="projectUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Project Report URL</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  className="bg-charcoal-800 border-gray-600 text-white"
                                  placeholder="https://example.com/report.pdf or /reports/file.pdf"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-500">
                                Enter the URL to the project report (PDF or HTML)
                              </p>
                              {editingProject?.projectUrl && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400">Current report:</p>
                                  <a 
                                    href={editingProject.projectUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-royal-400 hover:text-royal-300 text-sm underline"
                                  >
                                    {editingProject.projectUrl}
                                  </a>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={projectForm.control}
                        name="githubUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">GitHub URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-charcoal-800 border-gray-600 text-white"
                                placeholder="https://github.com/..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        className="bg-royal-500 hover:bg-royal-600 text-white"
                        disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                      >
                        {editingProject ? "Update Project" : "Add Project"}
                      </Button>
                      {editingProject && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                          className="glass-effect border-gray-600 text-gray-300 hover:text-white"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="glass-effect border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GripVertical className="w-5 h-5" />
                  Existing Projects
                  <span className="text-sm text-gray-400 font-normal">
                    (Drag to reorder)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-500 mx-auto"></div>
                    <p className="text-gray-300 mt-4">Loading projects...</p>
                  </div>
                ) : (
                  <DraggableProjectList
                    projects={projects}
                    onReorder={handleProjectReorder}
                    onEdit={startEditing}
                    onDelete={handleDeleteProject}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-effect border-gray-600">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Site Settings</CardTitle>
                  {!isEditingSettings ? (
                    <Button
                      onClick={() => setIsEditingSettings(true)}
                      className="bg-royal-500 hover:bg-royal-600 text-white"
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit Settings
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsEditingSettings(false);
                        settingsForm.reset({
                          contactEmail: siteSettings?.contactEmail || "",
                          contactPhone: siteSettings?.contactPhone || "",
                          linkedinUrl: siteSettings?.linkedinUrl || "",
                          bio: siteSettings?.bio || "",
                        });
                      }}
                      variant="outline"
                      className="glass-effect border-gray-600 text-gray-300 hover:text-white"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditingSettings ? (
                  // Display mode - show current information
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gray-300 text-sm font-medium">Contact Email</Label>
                        <div className="mt-1 p-3 bg-charcoal-800 border border-gray-600 rounded-md text-white">
                          {siteSettings?.contactEmail || "Not set"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm font-medium">Phone Number</Label>
                        <div className="mt-1 p-3 bg-charcoal-800 border border-gray-600 rounded-md text-white">
                          {siteSettings?.contactPhone || "Not set"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 text-sm font-medium">LinkedIn URL</Label>
                      <div className="mt-1 p-3 bg-charcoal-800 border border-gray-600 rounded-md text-white">
                        {siteSettings?.linkedinUrl ? (
                          <a href={siteSettings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-royal-400 hover:underline">
                            {siteSettings.linkedinUrl}
                          </a>
                        ) : (
                          "Not set"
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 text-sm font-medium">Bio/Introduction</Label>
                      <div className="mt-1 p-3 bg-charcoal-800 border border-gray-600 rounded-md text-white whitespace-pre-wrap min-h-[100px]">
                        {siteSettings?.bio || "Not set"}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit mode - show form
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={settingsForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Contact Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  value={field.value || ""}
                                  className="bg-charcoal-800 border-gray-600 text-white"
                                  placeholder="your.email@example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={settingsForm.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  type="tel"
                                  className="bg-charcoal-800 border-gray-600 text-white"
                                  placeholder="+1 (555) 123-4567"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={settingsForm.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">LinkedIn URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-charcoal-800 border-gray-600 text-white"
                                placeholder="https://linkedin.com/in/yourusername"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Bio/Introduction</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ""}
                                className="bg-charcoal-800 border-gray-600 text-white"
                                rows={4}
                                placeholder="Tell visitors about yourself..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          className="bg-royal-500 hover:bg-royal-600 text-white"
                          disabled={updateSettingsMutation.isPending}
                        >
                          Save Settings
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setIsEditingSettings(false);
                            settingsForm.reset({
                              contactEmail: siteSettings?.contactEmail || "",
                              contactPhone: siteSettings?.contactPhone || "",
                              linkedinUrl: siteSettings?.linkedinUrl || "",
                              bio: siteSettings?.bio || "",
                            });
                          }}
                          variant="outline"
                          className="glass-effect border-gray-600 text-gray-300 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass-effect border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Portfolio Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsCharts />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
