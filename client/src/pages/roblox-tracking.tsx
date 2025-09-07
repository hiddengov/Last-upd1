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
import { ArrowLeft, Link2, Copy, Eye, Trash2, Plus, Users, Server, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { createRobloxLinkSchema, type CreateRobloxLink, type RobloxLink } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type RobloxLinkWithTracking = RobloxLink & { trackingUrl: string };

export default function RobloxTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CreateRobloxLink>({
    resolver: zodResolver(createRobloxLinkSchema),
    defaultValues: {
      originalUrl: "",
      linkType: "private_server",
      title: "",
      description: "",
    },
  });

  // Fetch Roblox links
  const { data: robloxLinks, isLoading } = useQuery<RobloxLinkWithTracking[]>({
    queryKey: ["/api/roblox-links"],
  });

  // Create Roblox link mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRobloxLink) => 
      apiRequest("/api/roblox-links", {
        method: "POST",
        body: JSON.stringify(data),
      }),
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
      apiRequest(`/api/roblox-links/${id}`, {
        method: "DELETE",
      }),
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

  const onSubmit = (data: CreateRobloxLink) => {
    createMutation.mutate(data);
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
                Enter a Roblox URL to generate a tracking link that logs visitor information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            data-testid="input-original-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      disabled={createMutation.isPending}
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

        {/* Links List */}
        <div className="space-y-4">
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
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Tracking:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-xs">
                            {link.trackingUrl}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.trackingUrl)}
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
        </div>
      </div>
    </div>
  );
}