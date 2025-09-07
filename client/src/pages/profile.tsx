import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, ArrowLeft, Camera, Lock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { updateProfileSchema, updatePasswordSchema } from "@shared/schema";
import type { UpdateProfile, UpdatePassword, User as UserType } from "@shared/schema";
import Sidebar from "@/components/dashboard/sidebar";

export default function Profile() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  // Get current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });

  // Profile update form
  const profileForm = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      profilePicture: user?.profilePicture || null,
    },
    values: {
      username: user?.username || "",
      profilePicture: user?.profilePicture || null,
    },
  });

  // Password update form
  const passwordForm = useForm<UpdatePassword>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Profile update failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: UpdatePassword) => {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Password update failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setProfilePicturePreview(base64String);
        profileForm.setValue('profilePicture', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const onProfileSubmit = (data: UpdateProfile) => {
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: UpdatePassword) => {
    passwordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                  Profile Settings
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="text-page-description">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">

              {/* Profile Information Card */}
              <Card data-testid="card-profile-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your username and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">

                      {/* Profile Picture */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24" data-testid="avatar-profile">
                            <AvatarImage 
                              src={profilePicturePreview || user?.profilePicture || undefined} 
                              alt="Profile picture" 
                            />
                            <AvatarFallback className="text-2xl">
                              {user?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <Label
                            htmlFor="profile-picture"
                            className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                            data-testid="button-change-avatar"
                          >
                            <Camera className="h-4 w-4" />
                          </Label>
                          <Input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfilePictureChange}
                            data-testid="input-profile-picture"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Profile Picture</h3>
                          <p className="text-sm text-muted-foreground">
                            Click the camera icon to upload a new profile picture
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum file size: 5MB
                          </p>
                        </div>
                      </div>

                      {/* Username */}
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                data-testid="input-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={profileMutation.isPending}
                        className="animate-button animate-pulse-subtle"
                        data-testid="button-save-profile"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Password Change Card */}
              <Card data-testid="card-password-change">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your account password for better security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">

                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your current password" 
                                {...field} 
                                data-testid="input-current-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your new password" 
                                {...field} 
                                data-testid="input-new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your new password" 
                                {...field} 
                                data-testid="input-confirm-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={passwordMutation.isPending}
                        className="animate-button animate-pulse-subtle"
                        data-testid="button-save-password"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}