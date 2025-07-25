import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertProjectSchema, insertSiteSettingsSchema } from "@shared/schema";
import type { Project, SiteSettings, InsertProjectData, InsertSiteSettingsData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Plus, Edit2, X, BarChart3 } from "lucide-react";
import AnalyticsCharts from "@/components/AnalyticsCharts";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

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

  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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
          window.location.href = "/api/login";
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
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await apiRequest("PUT", `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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
          window.location.href = "/api/login";
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
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
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
          window.location.href = "/api/login";
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
      const response = await apiRequest("POST", "/api/site-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Success",
        description: "Site settings updated successfully",
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
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update site settings",
        variant: "destructive",
      });
    },
  });

  const handleProjectSubmit = (data: InsertProjectData) => {
    console.log("Form data received:", data);
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'projectUrl' && value !== undefined && value !== null) {
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

    const reportFile = (document.getElementById('project-report') as HTMLInputElement)?.files?.[0];
    if (reportFile) {
      formData.append('report', reportFile);
    }
    
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: formData });
    } else {
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
    projectForm.reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-500 mx-auto"></div>
          <p className="text-gray-300 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
              onClick={() => window.location.href = "/api/logout"}
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
                        <Label className="text-gray-300">Project Image</Label>
                        {editingProject?.imageUrl && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-400">Current image:</p>
                            <img 
                              src={editingProject.imageUrl} 
                              alt="Current project image" 
                              className="w-20 h-20 object-cover rounded border border-gray-600"
                            />
                          </div>
                        )}
                        <Input
                          id="project-image"
                          type="file"
                          accept="image/*"
                          className="bg-charcoal-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Project Report</Label>
                        {editingProject?.projectUrl && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-400">Current report:</p>
                            <a 
                              href={editingProject.projectUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-royal-400 hover:text-royal-300 text-sm underline"
                            >
                              {editingProject.projectUrl.split('/').pop()}
                            </a>
                          </div>
                        )}
                        <Input
                          id="project-report"
                          type="file"
                          accept=".pdf,.html,.htm"
                          className="bg-charcoal-800 border-gray-600 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload PDF or HTML file for the project report
                        </p>
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
                <CardTitle className="text-white">Existing Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-500 mx-auto"></div>
                    <p className="text-gray-300 mt-4">Loading projects...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No projects yet. Add your first project above!</p>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-effect rounded-xl p-4 border border-gray-600"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
                            <p className="text-gray-300 text-sm mb-2">{project.simplifiedDescription}</p>
                            {project.technologies && project.technologies.length > 0 && (
                              <p className="text-royal-400 text-sm font-mono">{project.technologies.join(', ')}</p>
                            )}
                            {project.category && (
                              <p className="text-blue-400 text-sm">{project.category}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(project)}
                              className="glass-effect border-gray-600 text-gray-300 hover:text-white"
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProjectMutation.mutate(project.id)}
                              className="glass-effect border-gray-600 text-red-400 hover:text-red-300"
                              disabled={deleteProjectMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                                  {...field}
                                  type="email"
                                  className="bg-charcoal-800 border-gray-600 text-white"
                                  placeholder="your@email.com"
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
