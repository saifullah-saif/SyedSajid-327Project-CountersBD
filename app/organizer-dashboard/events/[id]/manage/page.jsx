"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactSelect from "react-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import {
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  MapPin,
  Upload,
  Settings,
  Ticket,
  Image as ImageIcon,
  Clock,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Heart,
  ChevronRight,
  Music,
  FileText,
  Loader2,
} from "lucide-react";
import axios from "axios";

// Initial empty event structure
const emptyEventData = {
  id: null,
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  saleStartDate: "",
  saleEndDate: "",
  venueName: "",
  venueAddress: "",
  city: "",
  mapLink: "",
  eventPolicy: "",
  bannerImage: null,
  genreId: "",
  locationId: "",
  status: "draft",
  capacity: 0,
  eventArtists: [],
  categories: [],
  stats: {
    tickets_sold: 0,
    revenue: 0,
    attendee_count: 0,
  },
};

function ManageEventContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [eventData, setEventData] = useState(emptyEventData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [eventArtists, setEventArtists] = useState([]);

  const [locations, setLocations] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);

  // Modal states for adding new location/artist
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddArtistModal, setShowAddArtistModal] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isAddingArtist, setIsAddingArtist] = useState(false);

  // New location/artist form data
  const [newLocationData, setNewLocationData] = useState({
    city: "",
    venue_name: "",
    address: "",
    map_link: "",
  });

  const [newArtistData, setNewArtistData] = useState({
    name: "",
    bio: "",
    image: "",
  });

  // File upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingTicketFiles, setUploadingTicketFiles] = useState({});

  const handleParamsChange = useCallback((newParams) => {
    setParams(newParams);
  }, []);

  // Load available genres and artists on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load genres
      const genresResponse = await axios.get("/api/genres");
      if (genresResponse.data.success) {
        setAvailableGenres(genresResponse.data.data);
      }

      // Load artists
      const artistsResponse = await axios.get("/api/artists");
      if (artistsResponse.data.success) {
        setAvailableArtists(artistsResponse.data.data);
      }

      // Load locations
      const locationsResponse = await axios.get("/api/locations/allLoctions");
      if (locationsResponse.data.success) {
        setLocations(locationsResponse.data.data);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast({
        title: "Warning",
        description:
          "Some resources failed to load. You may experience limited functionality.",
        variant: "destructive",
      });
    }
  };

  // Load event data based on ID
  useEffect(() => {
    const loadEventData = async () => {
      if (!params?.id) return;

      setIsLoading(true);
      try {
        const response = await axios.get(`/api/organizer/events/${params.id}`);
        if (response.data.success) {
          const loadedEvent = response.data.event;

          console.log("Loaded event datas:", loadedEvent);
          // Format dates for input fields (YYYY-MM-DD)
          const formatDate = (dateString) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().split("T")[0];
          };

          // Set event data with proper formatting
          setEventData({
            ...loadedEvent,
            startDate: formatDate(loadedEvent.startDate),
            endDate: formatDate(loadedEvent.endDate),
            saleStartDate: formatDate(loadedEvent.saleStartDate),
            saleEndDate: formatDate(loadedEvent.saleEndDate),
          });

          setEventArtists(loadedEvent.eventArtists || []);

          console.log("Event loaded successfully:", loadedEvent.title);
        } else {
          throw new Error(response.data.message || "Failed to load event data");
        }
      } catch (error) {
        console.error("Failed to load event:", error);
        toast({
          title: "Error Loading Event",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to load event data. Please try again.",
          variant: "destructive",
        });

        // Redirect back to events list after a delay
        setTimeout(() => {
          router.push("/organizer-dashboard/events");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) {
      loadEventData();
    }
  }, [params?.id, toast, router]);

  const handleInputChange = (field, value) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Artist management functions
  const addEventArtist = (artistId) => {
    const artist = availableArtists.find((a) => a.artist_id === artistId);
    if (artist && !eventArtists.find((ea) => ea.artist_id === artistId)) {
      setEventArtists((prev) => [...prev, artist]);
      setHasChanges(true);
    }
  };

  const handleAddArtist = async () => {
    if (!newArtistData.name) {
      toast({
        title: "Validation Error",
        description: "Artist name is required",
        variant: "destructive",
      });
      return;
    }

    setIsAddingArtist(true);
    try {
      const response = await axios.post("/api/artists", newArtistData);

      if (response.data.success) {
        // Add to artists list
        setAvailableArtists((prev) => [...prev, response.data.data]);

        // Add to event artists
        addEventArtist(response.data.data.artist_id);

        toast({
          title: "Success",
          description: "Artist added successfully",
        });

        // Reset form and close modal
        setNewArtistData({
          name: "",
          bio: "",
          image: "",
        });
        setShowAddArtistModal(false);
      }
    } catch (error) {
      console.error("Error adding artist:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add artist",
        variant: "destructive",
      });
    } finally {
      setIsAddingArtist(false);
    }
  };

  const removeEventArtist = (artistId) => {
    setEventArtists((prev) =>
      prev.filter((artist) => artist.artist_id !== artistId)
    );
    setHasChanges(true);
  };

  const handleAddLocation = async () => {
    if (!newLocationData.city) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive",
      });
      return;
    }

    setIsAddingLocation(true);
    try {
      const response = await axios.post(
        "/api/locations/allLoctions",
        newLocationData
      );

      if (response.data.success) {
        // Add to locations list
        setLocations((prev) => [...prev, response.data.data]);

        // Select the new location
        handleInputChange("locationId", response.data.data.location_id);

        toast({
          title: "Success",
          description: "Location added successfully",
        });

        // Reset form and close modal
        setNewLocationData({
          city: "",
          venue_name: "",
          address: "",
          map_link: "",
        });
        setShowAddLocationModal(false);
      }
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add location",
        variant: "destructive",
      });
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleLocationChange = (locId) => {
    const selectedLocation = locations.find((loc) => loc.location_id === locId);
    if (selectedLocation) {
      setEventData((prev) => ({
        ...prev,
        venueName: selectedLocation.venue_name,
        venueAddress: selectedLocation.address,
        city: selectedLocation.city,
        mapLink: selectedLocation.map_link,
        locationId: locId,
      }));

      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!params?.id) {
      toast({
        title: "Error",
        description: "Event ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const requiredFields = [
      { field: "title", label: "Event Title" },
      { field: "description", label: "Description" },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
      { field: "startTime", label: "Start Time" },
      { field: "saleStartDate", label: "Sale Start Date" },
      { field: "saleEndDate", label: "Sale End Date" },
      { field: "venueName", label: "Venue Name" },
    ];

    for (const { field, label } of requiredFields) {
      if (!eventData[field]) {
        toast({
          title: "Validation Error",
          description: `${label} is required`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Prepare data for update - use PUT endpoint at /api/organizer/events/[id]
      const updateData = {
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        saleStartDate: eventData.saleStartDate,
        saleEndDate: eventData.saleEndDate,
        venueName: eventData.venueName,
        venueAddress: eventData.venueAddress || "",
        city: eventData.city || "",
        mapLink: eventData.mapLink || "",
        eventPolicy: eventData.eventPolicy || "",
        bannerImage: eventData.bannerImage,
        genreId: eventData.genreId,
        locationId: eventData.locationId,
        categories: eventData.categories,
        eventArtists: eventArtists,
        status: eventData.status,
      };

      console.log("Saving event with data:", updateData);

      const response = await axios.put(
        `/api/organizer/events/${params.id}`,
        updateData
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Event saved successfully",
        });
        setHasChanges(false);

        // Reload event data to get updated stats
        const refreshResponse = await axios.get(
          `/api/organizer/events/${params.id}`
        );
        if (refreshResponse.data.success) {
          const loadedEvent = refreshResponse.data.event;
          const formatDate = (dateString) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().split("T")[0];
          };

          setEventData({
            ...loadedEvent,
            startDate: formatDate(loadedEvent.startDate),
            endDate: formatDate(loadedEvent.endDate),
            saleStartDate: formatDate(loadedEvent.saleStartDate),
            saleEndDate: formatDate(loadedEvent.saleEndDate),
          });
          setEventArtists(loadedEvent.eventArtists || []);
        }
      } else {
        throw new Error(response.data.message || "Failed to save event");
      }
    } catch (error) {
      console.error("Failed to save event:", error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to save event",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!params?.id) {
      toast({
        title: "Error",
        description: "Event ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Check if there are unsaved changes
    if (hasChanges) {
      toast({
        title: "Unsaved Changes",
        description: "Please save your changes before publishing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use PATCH endpoint to update status
      const response = await axios.patch(`/api/organizer/events/${params.id}`, {
        status: "live", // Change status to live when publishing
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Event published successfully",
        });
        setEventData((prev) => ({ ...prev, status: "live" }));
      } else {
        throw new Error(response.data.message || "Failed to publish event");
      }
    } catch (error) {
      console.error("Failed to publish event:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to publish event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    // Open event preview in new tab
    window.open(`/events/${params.id}`, "_blank");
  };

  // File upload handlers
  const handleEventBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only JPEG, JPG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size exceeds 10MB limit",
        variant: "destructive",
      });
      return;
    }

    setUploadingBanner(true);
    setHasChanges(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", params.id);

      const response = await axios.post(
        "/api/organizer/upload/banner",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        handleInputChange("bannerImage", response.data.data.publicUrl);
        toast({
          title: "Success",
          description: "Event banner uploaded successfully",
        });
      } else {
        throw new Error(response.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading event banner:", error);
      toast({
        title: "Upload Failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "Failed to upload banner",
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleTicketBannerUpload = async (categoryIndex, ticketIndex, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only JPEG, JPG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size exceeds 10MB limit",
        variant: "destructive",
      });
      return;
    }

    const uploadKey = `${categoryIndex}-${ticketIndex}-banner`;
    setUploadingTicketFiles((prev) => ({ ...prev, [uploadKey]: true }));
    setHasChanges(true);

    try {
      const ticket = eventData.categories[categoryIndex].tickets[ticketIndex];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", params.id);
      formData.append("ticketTypeId", ticket.id);

      const response = await axios.post(
        "/api/organizer/upload/ticket-banner",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const newCategories = [...eventData.categories];
        newCategories[categoryIndex].tickets[ticketIndex].banner =
          response.data.data.publicUrl;
        setEventData((prev) => ({
          ...prev,
          categories: newCategories,
        }));
        setHasChanges(true);
        toast({
          title: "Success",
          description: "Ticket banner uploaded successfully",
        });
      } else {
        throw new Error(response.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading ticket banner:", error);
      toast({
        title: "Upload Failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "Failed to upload ticket banner",
        variant: "destructive",
      });
    } finally {
      setUploadingTicketFiles((prev) => {
        const updated = { ...prev };
        delete updated[uploadKey];
        return updated;
      });
    }
  };

  const handleTicketPdfUpload = async (categoryIndex, ticketIndex, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size exceeds 10MB limit",
        variant: "destructive",
      });
      return;
    }

    const uploadKey = `${categoryIndex}-${ticketIndex}-pdf`;
    setUploadingTicketFiles((prev) => ({ ...prev, [uploadKey]: true }));
    setHasChanges(true);

    try {
      const ticket = eventData.categories[categoryIndex].tickets[ticketIndex];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", params.id);
      formData.append("ticketTypeId", ticket.id);

      const response = await axios.post(
        "/api/organizer/upload/ticket-pdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const newCategories = [...eventData.categories];
        newCategories[categoryIndex].tickets[ticketIndex].pdfTemplate =
          response.data.data.publicUrl;
        setEventData((prev) => ({
          ...prev,
          categories: newCategories,
        }));
        setHasChanges(true);
        toast({
          title: "Success",
          description: "PDF template uploaded successfully",
        });
      } else {
        throw new Error(response.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading PDF template:", error);
      toast({
        title: "Upload Failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "Failed to upload PDF template",
        variant: "destructive",
      });
    } finally {
      setUploadingTicketFiles((prev) => {
        const updated = { ...prev };
        delete updated[uploadKey];
        return updated;
      });
    }
  };

  if (isLoading && !eventData.id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading event data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-zinc-400">
          <button
            onClick={() => router.push("/organizer-dashboard")}
            className="hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => router.push("/organizer-dashboard/events")}
            className="hover:text-white transition-colors"
          >
            Events
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white font-medium">
            {eventData.title || "Manage Event"}
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/organizer-dashboard/events")}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Manage Event</h1>
              <p className="text-zinc-400 text-sm lg:text-base">
                Edit and manage your event details
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handlePreview}
              className="border-zinc-700 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Preview</span>
              <span className="sm:hidden">Preview Event</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || isLoading}
              className="border-zinc-700 w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isLoading || isSaving || hasChanges}
              className="bg-primary hover:bg-red-700 w-full sm:w-auto"
            >
              {isLoading
                ? "Publishing..."
                : eventData.status === "live"
                ? "Published"
                : "Publish Event"}
            </Button>
          </div>
        </div>

        {/* Status Indicator */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
          >
            <p className="text-yellow-400 text-sm">
              You have unsaved changes. Don't forget to save your work.
            </p>
          </motion.div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 w-full justify-start overflow-x-auto">
            <TabsTrigger value="details" className="whitespace-nowrap">
              <span className="hidden sm:inline">Event Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="whitespace-nowrap">
              <span className="hidden sm:inline">Location & Venue</span>
              <span className="sm:hidden">Location</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="whitespace-nowrap">
              <span className="hidden sm:inline">Artists & Genre</span>
              <span className="sm:hidden">Artists</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="whitespace-nowrap">
              Media
            </TabsTrigger>
            <TabsTrigger value="tickets" className="whitespace-nowrap">
              <span className="hidden sm:inline">Tickets & Pricing</span>
              <span className="sm:hidden">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="whitespace-nowrap">
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview" className="whitespace-nowrap">
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Event Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={eventData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter event title"
                    className="bg-accent border-zinc-700"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Event Description *</Label>
                  <Textarea
                    id="description"
                    value={eventData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe your event..."
                    rows={4}
                    className="bg-accent border-zinc-700"
                  />
                </div>

                <div>
                  <Label htmlFor="eventPolicy">Event Policy</Label>
                  <Textarea
                    id="eventPolicy"
                    value={eventData.eventPolicy}
                    onChange={(e) =>
                      handleInputChange("eventPolicy", e.target.value)
                    }
                    placeholder="Enter event policies, terms and conditions..."
                    rows={3}
                    className="bg-accent border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={eventData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="bg-accent border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={eventData.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className="bg-accent border-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={eventData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      className="bg-accent border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={eventData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      className="bg-accent border-zinc-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sale Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="saleStartDate">
                      Ticket Sale Start Date *
                    </Label>
                    <Input
                      id="saleStartDate"
                      type="date"
                      value={eventData.saleStartDate}
                      onChange={(e) =>
                        handleInputChange("saleStartDate", e.target.value)
                      }
                      className="bg-accent border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="saleEndDate">TicketSale End Date *</Label>
                    <Input
                      id="saleEndDate"
                      type="date"
                      value={eventData.saleEndDate}
                      onChange={(e) =>
                        handleInputChange("saleEndDate", e.target.value)
                      }
                      className="bg-accent border-zinc-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location & Venue Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Venue Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Location *</Label>
                    <Dialog
                      open={showAddLocationModal}
                      onOpenChange={setShowAddLocationModal}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-primary border-primary hover:bg-primary hover:text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Location
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-900 border-accent">
                        <DialogHeader>
                          <DialogTitle>Add New Location</DialogTitle>
                          <DialogDescription>
                            Fill in the location details to add it to the
                            database.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="new-city">City *</Label>
                            <Input
                              id="new-city"
                              value={newLocationData.city}
                              onChange={(e) =>
                                setNewLocationData((prev) => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              placeholder="Enter city name"
                              className="bg-accent border-zinc-700"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-venue-name">Venue Name</Label>
                            <Input
                              id="new-venue-name"
                              value={newLocationData.venue_name}
                              onChange={(e) =>
                                setNewLocationData((prev) => ({
                                  ...prev,
                                  venue_name: e.target.value,
                                }))
                              }
                              placeholder="Enter venue name"
                              className="bg-accent border-zinc-700"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-address">Address</Label>
                            <Textarea
                              id="new-address"
                              value={newLocationData.address}
                              onChange={(e) =>
                                setNewLocationData((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              placeholder="Enter full address"
                              rows={2}
                              className="bg-accent border-zinc-700"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-map-link">Map Link</Label>
                            <Input
                              id="new-map-link"
                              value={newLocationData.map_link}
                              onChange={(e) =>
                                setNewLocationData((prev) => ({
                                  ...prev,
                                  map_link: e.target.value,
                                }))
                              }
                              placeholder="Google Maps or other map link"
                              className="bg-accent border-zinc-700"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddLocationModal(false)}
                            disabled={isAddingLocation}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleAddLocation}
                            disabled={isAddingLocation}
                            className="bg-primary hover:bg-red-700"
                          >
                            {isAddingLocation ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Location"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ReactSelect
                    value={
                      eventData.locationId
                        ? {
                            value: eventData.locationId,
                            label: `${eventData.city || ""} - ${
                              eventData.venueName || "N/A"
                            }`,
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      handleLocationChange(selectedOption?.value)
                    }
                    options={locations.map((loc) => ({
                      value: loc.location_id,
                      label: `${loc.city} - ${loc.venue_name || "N/A"}`,
                      searchText: `${loc.city} ${loc.venue_name || ""} ${
                        loc.address || ""
                      } ${loc.map_link || ""}`,
                    }))}
                    placeholder="Search by city, venue, or address..."
                    isClearable
                    isSearchable
                    filterOption={(option, inputValue) => {
                      return option.data.searchText
                        .toLowerCase()
                        .includes(inputValue.toLowerCase());
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: "hsl(var(--accent))",
                        borderColor: "hsl(var(--border))",
                        "&:hover": {
                          borderColor: "hsl(var(--border))",
                        },
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "hsl(var(--accent))",
                        borderColor: "hsl(var(--border))",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused
                          ? "hsl(var(--primary))"
                          : "hsl(var(--accent))",
                        color: "hsl(var(--foreground))",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "hsl(var(--foreground))",
                      }),
                      input: (base) => ({
                        ...base,
                        color: "hsl(var(--foreground))",
                      }),
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Artists & Genre Tab */}
          <TabsContent value="artists" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Genre Selection */}
              <Card className="bg-zinc-900 border-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Event Genre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="genre">Select Genre *</Label>
                    <Select
                      value={eventData.genreId ? String(eventData.genreId) : ""}
                      onValueChange={(value) =>
                        handleInputChange("genreId", value)
                      }
                    >
                      <SelectTrigger className="bg-accent border-zinc-700">
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGenres.map((genre) => (
                          <SelectItem key={genre.id} value={String(genre.id)}>
                            <div className="flex items-center gap-2">
                              {genre.icon && <img src={genre.icon} alt="" />}
                              <span>{genre.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Event Artists */}
              <Card className="bg-zinc-900 border-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Event Artists
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Add Artist</Label>
                      <Dialog
                        open={showAddArtistModal}
                        onOpenChange={setShowAddArtistModal}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary hover:bg-primary hover:text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Artist
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-accent">
                          <DialogHeader>
                            <DialogTitle>Add New Artist</DialogTitle>
                            <DialogDescription>
                              Fill in the artist details to add them to the
                              database.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="new-artist-name">
                                Artist Name *
                              </Label>
                              <Input
                                id="new-artist-name"
                                value={newArtistData.name}
                                onChange={(e) =>
                                  setNewArtistData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                placeholder="Enter artist name"
                                className="bg-accent border-zinc-700"
                              />
                            </div>
                            <div>
                              <Label htmlFor="new-artist-bio">Bio</Label>
                              <Textarea
                                id="new-artist-bio"
                                value={newArtistData.bio}
                                onChange={(e) =>
                                  setNewArtistData((prev) => ({
                                    ...prev,
                                    bio: e.target.value,
                                  }))
                                }
                                placeholder="Enter artist bio"
                                rows={3}
                                className="bg-accent border-zinc-700"
                              />
                            </div>
                            <div>
                              <Label htmlFor="new-artist-image">
                                Image URL
                              </Label>
                              <Input
                                id="new-artist-image"
                                value={newArtistData.image}
                                onChange={(e) =>
                                  setNewArtistData((prev) => ({
                                    ...prev,
                                    image: e.target.value,
                                  }))
                                }
                                placeholder="https://example.com/image.jpg"
                                className="bg-accent border-zinc-700"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddArtistModal(false)}
                              disabled={isAddingArtist}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleAddArtist}
                              disabled={isAddingArtist}
                              className="bg-primary hover:bg-red-700"
                            >
                              {isAddingArtist ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                "Add Artist"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <ReactSelect
                      value={null}
                      onChange={(selectedOption) => {
                        if (selectedOption) {
                          addEventArtist(selectedOption.value);
                        }
                      }}
                      options={availableArtists
                        .filter(
                          (artist) =>
                            !eventArtists.find(
                              (ea) => ea.artist_id === artist.artist_id
                            )
                        )
                        .map((artist) => ({
                          value: artist.artist_id,
                          label: artist.name,
                          searchText: `${artist.name} ${artist.bio || ""}`,
                        }))}
                      placeholder="Search and select an artist..."
                      isClearable
                      isSearchable
                      filterOption={(option, inputValue) => {
                        return option.data.searchText
                          .toLowerCase()
                          .includes(inputValue.toLowerCase());
                      }}
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "hsl(var(--accent))",
                          borderColor: "hsl(var(--border))",
                          "&:hover": {
                            borderColor: "hsl(var(--border))",
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: "hsl(var(--accent))",
                          borderColor: "hsl(var(--border))",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused
                            ? "hsl(var(--primary))"
                            : "hsl(var(--accent))",
                          color: "hsl(var(--foreground))",
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: "hsl(var(--foreground))",
                        }),
                        input: (base) => ({
                          ...base,
                          color: "hsl(var(--foreground))",
                        }),
                      }}
                    />
                  </div>

                  {/* Selected Artists */}
                  <div className="space-y-2">
                    <Label>Selected Artists ({eventArtists.length})</Label>
                    {eventArtists.length === 0 ? (
                      <p className="text-zinc-400 text-sm">
                        No artists selected
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {eventArtists.map((artist) => (
                          <div
                            key={artist.artist_id}
                            className="flex items-center justify-between p-3 bg-accent rounded-lg border border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={artist.image || "/artist-placeholder.png"}
                                alt={artist.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium">{artist.name}</p>
                                <p className="text-xs text-zinc-400">
                                  {artist.bio}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeEventArtist(artist.artist_id)
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Media Management Tab */}
          <TabsContent value="media" className="space-y-6">
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Event Banner Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {eventData.bannerImage ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={eventData.bannerImage}
                        alt="Event banner"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleEventBannerUpload}
                              disabled={uploadingBanner}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              disabled={uploadingBanner}
                              onClick={(e) => {
                                e.preventDefault();
                                e.currentTarget.previousElementSibling.click();
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {uploadingBanner ? "Uploading..." : "Replace"}
                            </Button>
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30"
                            onClick={() => {
                              handleInputChange("bannerImage", null);
                              setHasChanges(true);
                            }}
                            disabled={uploadingBanner}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-600 transition-colors">
                    <Upload className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Upload Event Banner
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      Click to upload your event banner image
                    </p>
                    <p className="text-xs text-zinc-500">
                      Recommended: 1920x1080px, PNG or JPG, max 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="event-banner-upload"
                      onChange={handleEventBannerUpload}
                      disabled={uploadingBanner}
                    />
                    <Button
                      className="mt-4 bg-primary hover:bg-red-700"
                      disabled={uploadingBanner}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("event-banner-upload").click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingBanner ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardContent className="space-y-6">
                <div className="bg-accent rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">
                    Media Guidelines
                  </h4>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• Images: JPG, PNG, WebP (max 10MB each)</li>

                    <li>• Recommended image aspect ratio: 16:9</li>
                    <li>
                      • Use high-quality images that represent your event well
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets & Pricing Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Ticket Categories</h2>
                <p className="text-zinc-400 text-sm">
                  Manage your event's ticket types and pricing
                </p>
              </div>
              <Button
                onClick={() => {
                  const newCategory = {
                    id: Date.now(),
                    name: "New Category",
                    type: "general",
                    categoryType: "general",
                    description: "",
                    tickets: [],
                  };
                  setEventData((prev) => ({
                    ...prev,
                    categories: [...prev.categories, newCategory],
                  }));
                  setHasChanges(true);
                }}
                className="bg-primary hover:bg-red-700 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {eventData.categories.map((category, categoryIndex) => (
              <Card key={category.id} className="bg-zinc-900 border-accent">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5" />
                      <div>
                        <Input
                          value={category.name}
                          onChange={(e) => {
                            const newCategories = [...eventData.categories];
                            newCategories[categoryIndex].name = e.target.value;
                            setEventData((prev) => ({
                              ...prev,
                              categories: newCategories,
                            }));
                            setHasChanges(true);
                          }}
                          className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                          placeholder="Category name"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCategories = eventData.categories.filter(
                          (_, i) => i !== categoryIndex
                        );
                        setEventData((prev) => ({
                          ...prev,
                          categories: newCategories,
                        }));
                        setHasChanges(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-rows-1 md:grid-rows-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Category Name</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => {
                            const newCategories = [...eventData.categories];
                            newCategories[categoryIndex].name = e.target.value;
                            setEventData((prev) => ({
                              ...prev,
                              categories: newCategories,
                            }));
                            setHasChanges(true);
                          }}
                          className="bg-accent border-zinc-700"
                          placeholder="Category name"
                        />
                      </div>

                      <div>
                        <Label>Category Type</Label>
                        <Input
                          type="text"
                          value={category.categoryType}
                          readOnly
                          className="mb-2 w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                          onChange={(e) => {
                            const newCategories = [...eventData.categories];
                            newCategories[categoryIndex].categoryType =
                              e.target.value;
                            setEventData((prev) => ({
                              ...prev,
                              categories: newCategories,
                            }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Category Description</Label>
                      <Textarea
                        value={category.description}
                        onChange={(e) => {
                          const newCategories = [...eventData.categories];
                          newCategories[categoryIndex].description =
                            e.target.value;
                          setEventData((prev) => ({
                            ...prev,
                            categories: newCategories,
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="Describe this ticket category..."
                        className="bg-accent border-zinc-700"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Tickets within this category */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Ticket Types</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newTicket = {
                            id: Date.now(),
                            name: "New Ticket",
                            price: 0,
                            quantity: 100,
                            sold: 0,
                            maxPerOrder: 10,
                            description: "",
                            banner: null,
                            pdfTemplate: null,
                          };
                          const newCategories = [...eventData.categories];
                          newCategories[categoryIndex].tickets.push(newTicket);
                          setEventData((prev) => ({
                            ...prev,
                            categories: newCategories,
                          }));
                          setHasChanges(true);
                        }}
                        className="border-zinc-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Ticket
                      </Button>
                    </div>

                    {category.tickets.map((ticket, ticketIndex) => (
                      <div
                        key={ticket.id}
                        className="bg-accent rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-full ">
                            <Label>Ticket Name</Label>
                            <Input
                              value={ticket.name}
                              onChange={(e) => {
                                const newCategories = [...eventData.categories];
                                newCategories[categoryIndex].tickets[
                                  ticketIndex
                                ].name = e.target.value;
                                setEventData((prev) => ({
                                  ...prev,
                                  categories: newCategories,
                                }));
                                setHasChanges(true);
                              }}
                              className="bg-accent border-zinc-700 mt-2"
                              placeholder="Ticket name"
                            />
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newCategories = [...eventData.categories];
                                newCategories[categoryIndex].tickets =
                                  newCategories[categoryIndex].tickets.filter(
                                    (_, i) => i !== ticketIndex
                                  );
                                setEventData((prev) => ({
                                  ...prev,
                                  categories: newCategories,
                                }));
                                setHasChanges(true);
                              }}
                              className="mt-6 text-red-400 hover:text-red-300 hover:bg-red-500/10 "
                            >
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Price (৳)</Label>
                            <Input
                              type="number"
                              value={ticket.price}
                              onChange={(e) => {
                                const newCategories = [...eventData.categories];
                                newCategories[categoryIndex].tickets[
                                  ticketIndex
                                ].price = parseFloat(e.target.value) || 0;
                                setEventData((prev) => ({
                                  ...prev,
                                  categories: newCategories,
                                }));
                                setHasChanges(true);
                              }}
                              className="bg-zinc-800 border-zinc-700"
                              min="0"
                              step="100"
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={ticket.quantity}
                              onChange={(e) => {
                                const newCategories = [...eventData.categories];
                                newCategories[categoryIndex].tickets[
                                  ticketIndex
                                ].quantity = parseInt(e.target.value) || 0;
                                setEventData((prev) => ({
                                  ...prev,
                                  categories: newCategories,
                                }));
                                setHasChanges(true);
                              }}
                              className="bg-zinc-800 border-zinc-700"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label>Max Per Order</Label>
                            <Input
                              type="number"
                              value={ticket.maxPerOrder || 10}
                              onChange={(e) => {
                                const newCategories = [...eventData.categories];
                                newCategories[categoryIndex].tickets[
                                  ticketIndex
                                ].maxPerOrder = parseInt(e.target.value) || 10;
                                setEventData((prev) => ({
                                  ...prev,
                                  categories: newCategories,
                                }));
                                setHasChanges(true);
                              }}
                              className="bg-zinc-800 border-zinc-700"
                              min="1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={ticket.description}
                            onChange={(e) => {
                              const newCategories = [...eventData.categories];
                              newCategories[categoryIndex].tickets[
                                ticketIndex
                              ].description = e.target.value;
                              setEventData((prev) => ({
                                ...prev,
                                categories: newCategories,
                              }));
                              setHasChanges(true);
                            }}
                            placeholder="Ticket description..."
                            className="bg-zinc-800 border-zinc-700"
                            rows={2}
                          />
                        </div>

                        {/* Ticket Images and Templates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Ticket Banner Image
                            </Label>
                            {ticket.banner ? (
                              <div className="mt-2 relative rounded-lg overflow-hidden">
                                <img
                                  src={ticket.banner}
                                  alt="Ticket banner"
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleTicketBannerUpload(
                                          categoryIndex,
                                          ticketIndex,
                                          e
                                        )
                                      }
                                      disabled={
                                        uploadingTicketFiles[
                                          `${categoryIndex}-${ticketIndex}-banner`
                                        ]
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/10 text-white"
                                      disabled={
                                        uploadingTicketFiles[
                                          `${categoryIndex}-${ticketIndex}-banner`
                                        ]
                                      }
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.previousElementSibling.click();
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      {uploadingTicketFiles[
                                        `${categoryIndex}-${ticketIndex}-banner`
                                      ]
                                        ? "..."
                                        : "Replace"}
                                    </Button>
                                  </label>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-500/20 text-red-400"
                                    onClick={() => {
                                      const newCategories = [
                                        ...eventData.categories,
                                      ];
                                      newCategories[categoryIndex].tickets[
                                        ticketIndex
                                      ].banner = null;
                                      setEventData((prev) => ({
                                        ...prev,
                                        categories: newCategories,
                                      }));
                                      setHasChanges(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors">
                                <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">
                                  Upload ticket image
                                </p>
                                <p className="text-xs text-zinc-500">
                                  PNG, JPG up to 10MB
                                </p>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  id={`ticket-banner-${categoryIndex}-${ticketIndex}`}
                                  onChange={(e) =>
                                    handleTicketBannerUpload(
                                      categoryIndex,
                                      ticketIndex,
                                      e
                                    )
                                  }
                                  disabled={
                                    uploadingTicketFiles[
                                      `${categoryIndex}-${ticketIndex}-banner`
                                    ]
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  disabled={
                                    uploadingTicketFiles[
                                      `${categoryIndex}-${ticketIndex}-banner`
                                    ]
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document
                                      .getElementById(
                                        `ticket-banner-${categoryIndex}-${ticketIndex}`
                                      )
                                      .click();
                                  }}
                                >
                                  {uploadingTicketFiles[
                                    `${categoryIndex}-${ticketIndex}-banner`
                                  ]
                                    ? "Uploading..."
                                    : "Choose File"}
                                </Button>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              PDF Template
                            </Label>
                            {ticket.pdfTemplate ? (
                              <div className="mt-2 border-2 border-zinc-600 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        PDF Template
                                      </p>
                                      <p className="text-xs text-zinc-400">
                                        Uploaded
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={(e) =>
                                          handleTicketPdfUpload(
                                            categoryIndex,
                                            ticketIndex,
                                            e
                                          )
                                        }
                                        disabled={
                                          uploadingTicketFiles[
                                            `${categoryIndex}-${ticketIndex}-pdf`
                                          ]
                                        }
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={
                                          uploadingTicketFiles[
                                            `${categoryIndex}-${ticketIndex}-pdf`
                                          ]
                                        }
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.currentTarget.previousElementSibling.click();
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </label>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400"
                                      onClick={() => {
                                        const newCategories = [
                                          ...eventData.categories,
                                        ];
                                        newCategories[categoryIndex].tickets[
                                          ticketIndex
                                        ].pdfTemplate = null;
                                        setEventData((prev) => ({
                                          ...prev,
                                          categories: newCategories,
                                        }));
                                        setHasChanges(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors">
                                <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">
                                  Upload PDF template
                                </p>
                                <p className="text-xs text-zinc-500">
                                  PDF files only, max 10MB
                                </p>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf"
                                  id={`ticket-pdf-${categoryIndex}-${ticketIndex}`}
                                  onChange={(e) =>
                                    handleTicketPdfUpload(
                                      categoryIndex,
                                      ticketIndex,
                                      e
                                    )
                                  }
                                  disabled={
                                    uploadingTicketFiles[
                                      `${categoryIndex}-${ticketIndex}-pdf`
                                    ]
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  disabled={
                                    uploadingTicketFiles[
                                      `${categoryIndex}-${ticketIndex}-pdf`
                                    ]
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document
                                      .getElementById(
                                        `ticket-pdf-${categoryIndex}-${ticketIndex}`
                                      )
                                      .click();
                                  }}
                                >
                                  {uploadingTicketFiles[
                                    `${categoryIndex}-${ticketIndex}-pdf`
                                  ]
                                    ? "Uploading..."
                                    : "Choose File"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ticket stats */}
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Available: {ticket.quantity - ticket.sold}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Revenue: ${(ticket.price * ticket.sold).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {category.tickets.length === 0 && (
                      <div className="text-center py-8 text-zinc-400">
                        <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tickets in this category yet</p>
                        <p className="text-sm">
                          Click "Add Ticket" to create your first ticket type
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {eventData.categories.length === 0 && (
              <Card className="bg-zinc-900 border-accent">
                <CardContent className="text-center py-12">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No ticket categories yet
                  </h3>
                  <p className="text-zinc-400 mb-4">
                    Create your first ticket category to start selling tickets
                    for your event
                  </p>
                  <Button
                    onClick={() => {
                      const newCategory = {
                        id: Date.now(),
                        name: "General Admission",
                        type: "general",
                        categoryType: "general",
                        description: "Standard access to the event",
                        tickets: [],
                      };
                      setEventData((prev) => ({
                        ...prev,
                        categories: [newCategory],
                      }));
                      setHasChanges(true);
                    }}
                    className="bg-primary hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Event Visibility & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Event Status</Label>
                    <select
                      value={eventData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full h-10 px-3 py-2 bg-accent border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="draft">Draft</option>
                      <option value="live">Published</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                    <p className="text-xs text-zinc-400 mt-1">
                      Draft events are not visible to the public
                    </p>
                  </div>
                  <div>
                    <Label>Event Visibility</Label>
                    <select
                      value={eventData.visibility || "public"}
                      onChange={(e) =>
                        handleInputChange("visibility", e.target.value)
                      }
                      className="w-full h-10 px-3 py-2 bg-accent border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                    </select>
                    <p className="text-xs text-zinc-400 mt-1">
                      Private events require invitation codes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Age Restrictions</Label>
                  <select
                    value={eventData.ageRestriction || "none"}
                    onChange={(e) =>
                      handleInputChange("ageRestriction", e.target.value)
                    }
                    className="w-full h-10 px-3 py-2 bg-accent border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="none">No restrictions</option>
                    <option value="18+">18+ only</option>
                    <option value="21+">21+ only</option>
                    <option value="all-ages">All ages welcome</option>
                  </select>
                </div>

                <div>
                  <Label>Dress Code</Label>
                  <Input
                    value={eventData.dressCode || ""}
                    onChange={(e) =>
                      handleInputChange("dressCode", e.target.value)
                    }
                    placeholder="e.g., Business casual, Formal, Casual"
                    className="bg-accent border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Special Instructions</Label>
                  <Textarea
                    value={eventData.specialInstructions || ""}
                    onChange={(e) =>
                      handleInputChange("specialInstructions", e.target.value)
                    }
                    placeholder="Any special instructions for attendees..."
                    rows={3}
                    className="bg-accent border-zinc-700"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-lg bg-red-500/5">
                  <div>
                    <h4 className="font-medium text-red-400">Cancel Event</h4>
                    <p className="text-sm text-zinc-400">
                      This will cancel the event and notify all attendees
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to cancel this event? This action cannot be undone."
                        )
                      ) {
                        handleInputChange("status", "cancelled");
                      }
                    }}
                  >
                    Cancel Event
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-lg bg-red-500/5">
                  <div>
                    <h4 className="font-medium text-red-400">Delete Event</h4>
                    <p className="text-sm text-zinc-400">
                      Permanently delete this event and all associated data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this event? This action cannot be undone and will permanently remove all data."
                        )
                      ) {
                        // In a real app, this would call delete API
                        toast({
                          title: "Event Deleted",
                          description:
                            "The event has been permanently deleted.",
                        });
                        router.push("/organizer-dashboard/events");
                      }
                    }}
                  >
                    Delete Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Event Preview</h2>
                <p className="text-zinc-400 text-sm">
                  See how your event will appear to attendees
                </p>
              </div>
              <Button
                onClick={handlePreview}
                className="bg-primary hover:bg-red-700 w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Open Full Preview</span>
                <span className="sm:hidden">Full Preview</span>
              </Button>
            </div>

            {/* Event Preview Card */}
            <Card className="bg-zinc-900 border-accent overflow-hidden">
              <div className="relative">
                {eventData.bannerImage ? (
                  <img
                    src={eventData.bannerImage}
                    alt={eventData.title}
                    className="aspect-[16/9] w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-r from-zinc-800 to-zinc-700 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
                      <p className="text-zinc-400">No banner image</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      eventData.status === "published"
                        ? "bg-green-500/20 text-green-400"
                        : eventData.status === "draft"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : eventData.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-zinc-500/20 text-zinc-400"
                    }`}
                  >
                    {eventData.status.charAt(0).toUpperCase() +
                      eventData.status.slice(1)}
                  </span>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Event Title and Description */}
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {eventData.title}
                    </h1>
                    <p className="text-zinc-300 leading-relaxed">
                      {eventData.description}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-white">Date & Time</p>
                          <p className="text-sm text-zinc-400">
                            {new Date(eventData.startDate).toLocaleDateString()}{" "}
                            at {eventData.startTime}
                            {eventData.endDate !== eventData.startDate && (
                              <>
                                {" "}
                                -{" "}
                                {new Date(
                                  eventData.endDate
                                ).toLocaleDateString()}
                              </>
                            )}
                            {eventData.endTime && (
                              <> until {eventData.endTime}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-white">
                            {eventData.venueName}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {eventData.venueAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Summary */}
                    <div>
                      <h3 className="font-medium text-white mb-3">
                        Available Tickets
                      </h3>
                      <div className="space-y-3">
                        {eventData.categories.map((category) => (
                          <div key={category.id}>
                            <h4 className="font-medium text-zinc-300 mb-2">
                              {category.name}
                            </h4>
                            {category.tickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="flex items-center justify-between p-3 bg-accent rounded-lg mb-2"
                              >
                                <div>
                                  <p className="font-medium text-white">
                                    {ticket.name}
                                  </p>
                                  <p className="text-sm text-zinc-400">
                                    {ticket.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">
                                    ${ticket.price}
                                  </p>
                                  <p className="text-xs text-zinc-400">
                                    {ticket.quantity - ticket.sold} available
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {eventData.categories.length === 0 && (
                          <div className="text-center py-8 text-zinc-400">
                            <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No tickets configured yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(eventData.ageRestriction &&
                    eventData.ageRestriction !== "none") ||
                  eventData.dressCode ||
                  eventData.specialInstructions ? (
                    <div className="border-t border-zinc-700 pt-6">
                      <h3 className="font-medium text-white mb-3">
                        Additional Information
                      </h3>
                      <div className="space-y-2 text-sm text-zinc-400">
                        {eventData.ageRestriction &&
                          eventData.ageRestriction !== "none" && (
                            <p>
                              <strong>Age Restriction:</strong>{" "}
                              {eventData.ageRestriction}
                            </p>
                          )}
                        {eventData.dressCode && (
                          <p>
                            <strong>Dress Code:</strong> {eventData.dressCode}
                          </p>
                        )}
                        {eventData.specialInstructions && (
                          <p>
                            <strong>Special Instructions:</strong>{" "}
                            {eventData.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons Preview */}
                  <div className="border-t border-zinc-700 pt-6">
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-primary hover:bg-red-700"
                        disabled
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                      <Button
                        variant="outline"
                        className="border-zinc-700"
                        disabled
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-center">
                      Preview only - buttons are disabled
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Publishing Status */}
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle>Publishing Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Event Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        eventData.status === "published"
                          ? "bg-green-500/20 text-green-400"
                          : eventData.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : eventData.status === "cancelled"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {eventData.status.charAt(0).toUpperCase() +
                        eventData.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Visibility</span>
                    <span className="text-zinc-400">
                      {(eventData.visibility || "public")
                        .charAt(0)
                        .toUpperCase() +
                        (eventData.visibility || "public").slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Total Categories</span>
                    <span className="text-zinc-400">
                      {eventData.categories.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Total Ticket Types</span>
                    <span className="text-zinc-400">
                      {eventData.categories.reduce(
                        (total, cat) => total + cat.tickets.length,
                        0
                      )}
                    </span>
                  </div>

                  {hasChanges && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
                      <p className="text-yellow-400 text-sm">
                        ⚠️ You have unsaved changes. Save your changes before
                        publishing.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Main export with Suspense boundary
export default function ManageEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event management...</p>
          </div>
        </div>
      }
    >
      <ManageEventContent />
    </Suspense>
  );
}
