"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import ReactSelect from "react-select";

import {
  Calendar,
  Clock,
  MapPin,
  Upload,
  Plus,
  Trash2,
  Eye,
  Save,
  ArrowLeft,
  Users,
  Music,
  Image as ImageIcon,
  FileText,
  Loader2,
} from "lucide-react";
import axios from "axios";

export default function CreateEventPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("details");
  const [eventData, setEventData] = useState({
    title: "",
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
    description: "",
    eventPolicy: "",
    bannerImage: null,
    genreId: "",
    locationId: "",
    categories: [],
  });

  const [categories, setCategories] = useState([]);
  const [eventArtists, setEventArtists] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [locations, setLocations] = useState([]);

  // File upload states - Store actual File objects for deferred upload
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null); // Store actual File object
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [ticketFiles, setTicketFiles] = useState({}); // Store File objects: {categoryId_ticketId_type: File}

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
        console.log(genresResponse.data.data);
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
        console.log("Loaded locations:", locationsResponse.data.data);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast({
        title: "Loading Failed",
        description: "Failed to load initial data. Using default values.",
        variant: "destructive",
      });

      // Fallback to default values
      setAvailableGenres([
        { genre_id: 1, name: "Music", icon: "🎵" },
        { genre_id: 2, name: "Sports", icon: "⚽" },
        { genre_id: 3, name: "Technology", icon: "💻" },
        { genre_id: 4, name: "Art", icon: "🎨" },
        { genre_id: 5, name: "Comedy", icon: "😂" },
      ]);

      setAvailableArtists([
        {
          artist_id: 1,
          name: "John Doe",
          bio: "Popular musician",
          image: "/artist-placeholder.png",
        },
        {
          artist_id: 2,
          name: "Jane Smith",
          bio: "Tech speaker",
          image: "/artist-placeholder.png",
        },
        {
          artist_id: 3,
          name: "Bob Johnson",
          bio: "Comedian",
          image: "/artist-placeholder.png",
        },
      ]);
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
    }
  };

  const handleInputChange = (field, value) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const addCategory = () => {
    const newCategory = {
      id: Date.now(),
      name: "",
      type: "general",
      description: "",
      categoryType: "general", // Maps to category_type in DB
      tickets: [],
    };
    setCategories((prev) => [...prev, newCategory]);
  };

  const updateCategory = (categoryId, field, value) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    );
  };

  const removeCategory = (categoryId) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
  };

  const addTicketType = (categoryId) => {
    const newTicket = {
      id: Date.now(),
      name: "",
      price: "",
      description: "",
      quantity: "",
      maxPerOrder: 10, // Maps to max_per_order in DB
      banner: null, // Maps to banner in DB
      pdfTemplate: null, // Maps to pdf_template in DB
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, tickets: [...cat.tickets, newTicket] }
          : cat
      )
    );
  };

  // Artist management functions
  const addEventArtist = (artistId) => {
    const artist = availableArtists.find((a) => a.artist_id === artistId);
    if (artist && !eventArtists.find((ea) => ea.artist_id === artistId)) {
      setEventArtists((prev) => [...prev, artist]);
    }
  };

  const removeEventArtist = (artistId) => {
    setEventArtists((prev) =>
      prev.filter((artist) => artist.artist_id !== artistId)
    );
  };

  const updateTicket = (categoryId, ticketId, field, value) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              tickets: cat.tickets.map((ticket) =>
                ticket.id === ticketId ? { ...ticket, [field]: value } : ticket
              ),
            }
          : cat
      )
    );
  };

  const removeTicket = (categoryId, ticketId) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              tickets: cat.tickets.filter((ticket) => ticket.id !== ticketId),
            }
          : cat
      )
    );
  };

  // File upload handlers - Store files in memory for deferred upload
  const handleEventBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Store file for deferred upload
    setBannerFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);

    toast({
      title: "Banner Selected",
      description: "Banner will be uploaded when you publish the event.",
    });
  };

  const handleTicketBannerUpload = async (categoryId, ticketId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB for ticket banners)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const uploadKey = `${categoryId}_${ticketId}_banner`;

    // Store file for deferred upload
    setTicketFiles((prev) => ({ ...prev, [uploadKey]: file }));

    // Create preview and update ticket data
    const reader = new FileReader();
    reader.onloadend = () => {
      updateTicket(categoryId, ticketId, "bannerPreview", reader.result);
      updateTicket(categoryId, ticketId, "bannerFile", file.name);
    };
    reader.readAsDataURL(file);

    toast("Ticket Banner Selected", {
      description: "Image will be uploaded when you publish the event.",
    });
  };

  const handleTicketPdfUpload = async (categoryId, ticketId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "PDF must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const uploadKey = `${categoryId}_${ticketId}_pdf`;

    // Store file for deferred upload
    setTicketFiles((prev) => ({ ...prev, [uploadKey]: file }));

    // Update ticket data with file name
    updateTicket(categoryId, ticketId, "pdfFile", file.name);

    toast({
      title: "PDF Template Selected",
      description: "PDF will be uploaded when you publish the event.",
    });
  };

  const removeBannerImage = () => {
    handleInputChange("bannerImage", null);
    setBannerPreview(null);
    setBannerFile(null);

    toast.success("Banner Removed", {
      description: "Event banner image has been removed.",
    });
  };

  const removeTicketFile = (categoryId, ticketId, fileType) => {
    const uploadKey = `${categoryId}_${ticketId}_${fileType}`;

    // Remove from ticketFiles state
    setTicketFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[uploadKey];
      return newFiles;
    });

    if (fileType === "banner") {
      updateTicket(categoryId, ticketId, "banner", null);
      updateTicket(categoryId, ticketId, "bannerFile", null);
      updateTicket(categoryId, ticketId, "bannerPreview", null);
    } else if (fileType === "pdf") {
      updateTicket(categoryId, ticketId, "pdfTemplate", null);
      updateTicket(categoryId, ticketId, "pdfFile", null);
    }
    toast({
      title: "File Removed",
      description: `${
        fileType === "banner" ? "Banner image" : "PDF template"
      } has been removed.`,
    });
  };

  // Add new location handler
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

  // Add new artist handler
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

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      // Basic validation for draft
      if (!eventData.title) {
        toast({
          title: "Title Required",
          description: "Please enter an event title before saving.",
          variant: "destructive",
        });
        return;
      }

      // Prepare the data for saving as draft
      const draftData = {
        title: eventData.title,
        description: eventData.description || "",
        startDate: eventData.startDate || null,
        endDate: eventData.endDate || null,
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        saleStartDate: eventData.saleStartDate || null,
        saleEndDate: eventData.saleEndDate || null,
        venueName: eventData.venueName || "",
        venueAddress: eventData.venueAddress || "",
        city: eventData.city || "",
        mapLink: eventData.mapLink || "",
        bannerImage: eventData.bannerImage || null,
        genreId: eventData.genreId || null,
        locationId: eventData.locationId || null,
        eventPolicy: eventData.eventPolicy || "",
        status: "draft",
        categories: categories.map((category) => ({
          name: category.name || "",
          description: category.description || "",
          categoryType: category.type || category.categoryType || "general",
          tickets: category.tickets.map((ticket) => ({
            name: ticket.name || "",
            description: ticket.description || "",
            price: parseFloat(ticket.price) || 0,
            quantity: parseInt(ticket.quantity) || 0,
            maxPerOrder: parseInt(ticket.maxPerOrder) || 10,
            banner: ticket.banner || null,
            pdfTemplate: ticket.pdfTemplate || null,
          })),
        })),
        artists: eventArtists.map((artist) => artist.artist_id),
      };

      console.log("Saving draft with data:", draftData);

      // Send request to API
      const response = await axios.post("/api/organizer/events", draftData);

      if (response.data.success) {
        toast({
          title: "Draft Saved",
          description: "Your event has been saved as a draft.",
        });
      } else {
        throw new Error(response.data.message || "Failed to save draft");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to save event as draft.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    console.log("=== PUBLISH FUNCTION STARTED ===");
    console.log("Current eventData:", eventData);
    console.log("Current categories:", categories);
    console.log("Current eventArtists:", eventArtists);

    if (isPublishing) {
      console.log("Already publishing, preventing duplicate request");
      return;
    }

    try {
      setIsPublishing(true);
      console.log("isPublishing set to true");

      // Validate required fields before publishing
      const requiredFields = [
        { field: "title", name: "Event Title" },
        { field: "startDate", name: "Start Date" },
        { field: "endDate", name: "End Date" },
        { field: "startTime", name: "Start Time" },
        { field: "endTime", name: "End Time" },
        { field: "saleStartDate", name: "Sale Start Date" },
        { field: "saleEndDate", name: "Sale End Date" },
        { field: "venueName", name: "Venue Name" },
        { field: "venueAddress", name: "Venue Address" },
        { field: "city", name: "City" },
        { field: "description", name: "Description" },
        { field: "genreId", name: "Genre" },
      ];

      console.log("Checking required fields...");
      const missingFields = requiredFields.filter(
        ({ field }) => !eventData[field] || eventData[field].trim() === ""
      );

      console.log("Missing fields:", missingFields);

      if (missingFields.length > 0) {
        console.log("VALIDATION FAILED: Missing required fields");
        toast({
          title: "Missing Required Fields",
          description: `Please fill in: ${missingFields
            .map((f) => f.name)
            .join(", ")}`,
          variant: "destructive",
        });
        setIsPublishing(false);
        return;
      }

      console.log("Required fields validation passed");

      console.log("Checking categories...");
      if (categories.length === 0) {
        console.log("VALIDATION FAILED: No categories");
        toast({
          title: "No Ticket Categories",
          description:
            "Please add at least one ticket category before publishing.",
          variant: "destructive",
        });
        setIsPublishing(false);
        return;
      }

      console.log("Categories validation passed. Count:", categories.length);

      // Validate categories have at least one ticket
      console.log("Checking categories have tickets...");
      const categoriesWithoutTickets = categories.filter(
        (cat) => cat.tickets.length === 0
      );
      if (categoriesWithoutTickets.length > 0) {
        console.log(
          "VALIDATION FAILED: Categories without tickets:",
          categoriesWithoutTickets
        );
        toast({
          title: "Incomplete Categories",
          description: "All categories must have at least one ticket type.",
          variant: "destructive",
        });
        setIsPublishing(false);
        return;
      }

      console.log("Categories tickets validation passed");

      // Validate ticket data completeness
      console.log("Checking ticket data completeness...");
      for (const category of categories) {
        for (const ticket of category.tickets) {
          if (!ticket.name || !ticket.price || !ticket.quantity) {
            console.log(
              "VALIDATION FAILED: Incomplete ticket in category:",
              category.name,
              "Ticket:",
              ticket
            );
            toast({
              title: "Incomplete Ticket Information",
              description: `Please complete all ticket details in category: ${category.name}`,
              variant: "destructive",
            });
            setIsPublishing(false);
            return;
          }
        }
      }

      console.log("Ticket data completeness validation passed");

      // === FILE UPLOAD PHASE ===
      console.log("=== STARTING FILE UPLOAD PHASE ===");
      toast({
        title: "Uploading Files",
        description: "Please wait while we upload your images and PDFs...",
      });

      let uploadedBannerUrl = eventData.bannerImage || null;

      // Upload event banner if a new file is selected
      if (bannerFile) {
        console.log("Uploading event banner...");
        try {
          const formData = new FormData();
          formData.append("bannerImage", bannerFile);
          formData.append("eventId", "temp_" + Date.now());

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
            uploadedBannerUrl = response.data.publicUrl;
            console.log("Event banner uploaded:", uploadedBannerUrl);
          } else {
            throw new Error(response.data.message || "Banner upload failed");
          }
        } catch (error) {
          console.error("Event banner upload failed:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload event banner. " + error.message,
            variant: "destructive",
          });
          setIsPublishing(false);
          return;
        }
      }

      // Upload ticket files (banners and PDFs)
      const updatedCategories = await Promise.all(
        categories.map(async (category) => {
          const updatedTickets = await Promise.all(
            category.tickets.map(async (ticket) => {
              let bannerUrl = ticket.banner || null;
              let pdfUrl = ticket.pdfTemplate || null;

              // Upload ticket banner if file exists
              const bannerKey = `${category.id}_${ticket.id}_banner`;
              if (ticketFiles[bannerKey]) {
                console.log(
                  `Uploading ticket banner for category ${category.id}, ticket ${ticket.id}...`
                );
                try {
                  const formData = new FormData();
                  formData.append("ticketBanner", ticketFiles[bannerKey]);
                  formData.append("eventId", "temp_" + Date.now());
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
                    bannerUrl = response.data.publicUrl;
                    console.log("Ticket banner uploaded:", bannerUrl);
                  } else {
                    throw new Error(
                      response.data.message || "Ticket banner upload failed"
                    );
                  }
                } catch (error) {
                  console.error("Ticket banner upload failed:", error);
                  throw error;
                }
              }

              // Upload ticket PDF if file exists
              const pdfKey = `${category.id}_${ticket.id}_pdf`;
              if (ticketFiles[pdfKey]) {
                console.log(
                  `Uploading ticket PDF for category ${category.id}, ticket ${ticket.id}...`
                );
                try {
                  const formData = new FormData();
                  formData.append("pdfTemplate", ticketFiles[pdfKey]);
                  formData.append("eventId", "temp_" + Date.now());
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
                    pdfUrl = response.data.publicUrl;
                    console.log("Ticket PDF uploaded:", pdfUrl);
                  } else {
                    throw new Error(
                      response.data.message || "PDF upload failed"
                    );
                  }
                } catch (error) {
                  console.error("Ticket PDF upload failed:", error);
                  throw error;
                }
              }

              return {
                name: ticket.name,
                description: ticket.description || "",
                price: parseFloat(ticket.price) || 0,
                quantity: parseInt(ticket.quantity) || 0,
                maxPerOrder: parseInt(ticket.maxPerOrder) || 10,
                banner: bannerUrl,
                pdfTemplate: pdfUrl,
              };
            })
          );

          return {
            name: category.name,
            description: category.description || "",
            categoryType: category.type || category.categoryType || "general",
            tickets: updatedTickets,
          };
        })
      );

      console.log("=== FILE UPLOAD PHASE COMPLETED ===");
      console.log("Uploaded banner URL:", uploadedBannerUrl);
      console.log("Updated categories with uploaded files:", updatedCategories);

      // Prepare the complete event data for publishing
      const publishData = {
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        saleStartDate: eventData.saleStartDate,
        saleEndDate: eventData.saleEndDate,
        venueName: eventData.venueName,
        venueAddress: eventData.venueAddress,
        city: eventData.city,
        mapLink: eventData.mapLink,
        bannerImage: uploadedBannerUrl,
        genreId: eventData.genreId,
        locationId: eventData.locationId,
        eventPolicy: eventData.eventPolicy,
        status: "pending", // Set to pending for admin approval
        categories: updatedCategories,
        artists: eventArtists.map((artist) => artist.artist_id),
      };

      console.log("=== ALL VALIDATIONS PASSED ===");
      console.log("Publishing event with data:", publishData);
      console.log("About to call API: POST /api/organizer/events");

      // Send request to API
      const response = await axios.post("/api/organizer/events", publishData);

      console.log("=== API CALL SUCCESSFUL ===");
      console.log("Publish response:", response.data);

      if (response.data.success) {
        console.log("Event published successfully, showing success message");
        toast({
          title: "Event Published Successfully",
          description: "Your event has been submitted for approval!",
        });

        console.log("Redirecting to events list in 1.5 seconds");
        // Redirect to events list after short delay
        setTimeout(() => {
          router.push("/organizer-dashboard/events");
        }, 1500);
      } else {
        console.log("API response success=false, throwing error");
        throw new Error(response.data.message || "Failed to publish event");
      }
    } catch (error) {
      console.error("=== PUBLISH ERROR CAUGHT ===");
      console.error("Error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      toast({
        title: "Publish Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to publish event. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log("Setting isPublishing back to false");
      setIsPublishing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Event</h1>
              <p className="text-zinc-400">
                Set up your event details and ticket categories
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
              className="border-zinc-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-primary hover:bg-red-700"
            >
              {isPublishing ? "Publishing..." : "Publish Event"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900">
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="location">Location & Venue</TabsTrigger>
            <TabsTrigger value="artists">Artists & Genre</TabsTrigger>
            <TabsTrigger value="tickets">Categories & Tickets</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
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
                    <Label htmlFor="saleEndDate">Ticket Sale End Date *</Label>
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

                <div>
                  <Label>Event Banner Image *</Label>
                  {bannerPreview || eventData.bannerImage ? (
                    <div className="max-w-screen-md mt-2 relative mx-auto mb-4">
                      {/* 16:9 Aspect Ratio Container */}
                      <div
                        className=" relative"
                        style={{ paddingTop: "56.25%" }}
                      >
                        <img
                          src={bannerPreview || eventData.bannerImage}
                          alt="Event Banner"
                          className="absolute inset-0 aspect-[16/9]  w-full h-auto object-cover rounded-lg"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeBannerImage}
                        className="absolute top-2 right-2 bg-primary text-white rounded-md px-2 py-1 flex items-center hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label
                        htmlFor="banner-upload"
                        className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer block"
                      >
                        {uploadingBanner ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                            <p className="text-zinc-400">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-400">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              PNG, JPG, WEBP up to 10MB (16:9 aspect ratio
                              recommended)
                            </p>
                          </>
                        )}
                        <input
                          id="banner-upload"
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleEventBannerUpload}
                          disabled={uploadingBanner}
                        />
                      </label>
                    </div>
                  )}
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

          {/* Categories & Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Ticket Categories</h3>
                <p className="text-zinc-400">
                  Create different categories and ticket types for your event
                </p>
              </div>
              <Button
                onClick={addCategory}
                className="bg-primary hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {categories.length === 0 ? (
              <Card className="bg-zinc-900 border-accent">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-zinc-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No categories yet
                  </h3>
                  <p className="text-zinc-400 text-center mb-6">
                    Create your first ticket category to get started
                  </p>
                  <Button
                    onClick={addCategory}
                    className="bg-primary hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {categories.map((category, categoryIndex) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <Card className="bg-zinc-900 border-accent">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Category {categoryIndex + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategory(category.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Category Name</Label>
                            <Input
                              value={category.name}
                              onChange={(e) =>
                                updateCategory(
                                  category.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., VIP, General Admission"
                              className="bg-accent border-zinc-700"
                            />
                          </div>
                          <div>
                            <Label>Category Type</Label>
                            <Input
                              type="text"
                              value={category.categoryType}
                              readOnly
                              className="mb-2 w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                              onChange={(e) =>
                                updateCategory(
                                  category.id,
                                  "categoryType",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={category.description}
                            onChange={(e) =>
                              updateCategory(
                                category.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Describe this category..."
                            className="bg-accent border-zinc-700"
                          />
                        </div>

                        {/* Tickets for this category */}
                        <div className="border-t border-accent pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Ticket Types</h4>
                            <Button
                              size="sm"
                              onClick={() => addTicketType(category.id)}
                              className="bg-zinc-700 hover:bg-zinc-600"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Ticket
                            </Button>
                          </div>

                          {category.tickets.map((ticket, ticketIndex) => (
                            <div
                              key={ticket.id}
                              className="bg-accent rounded-lg p-4 mb-4"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <h5 className="font-medium">
                                  Ticket {ticketIndex + 1}
                                </h5>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeTicket(category.id, ticket.id)
                                  }
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Ticket Name</Label>
                                  <Input
                                    value={ticket.name}
                                    onChange={(e) =>
                                      updateTicket(
                                        category.id,
                                        ticket.id,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., Early Bird, Regular"
                                    className="bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                                <div>
                                  <Label>Price ($)</Label>
                                  <Input
                                    type="number"
                                    value={ticket.price}
                                    onChange={(e) =>
                                      updateTicket(
                                        category.id,
                                        ticket.id,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0.00"
                                    className="bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                                <div>
                                  <Label>Quantity Available</Label>
                                  <Input
                                    type="number"
                                    value={ticket.quantity}
                                    onChange={(e) =>
                                      updateTicket(
                                        category.id,
                                        ticket.id,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    placeholder="100"
                                    className="bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                                <div>
                                  <Label>Max Per Order</Label>
                                  <Input
                                    type="number"
                                    value={ticket.maxPerOrder}
                                    onChange={(e) =>
                                      updateTicket(
                                        category.id,
                                        ticket.id,
                                        "maxPerOrder",
                                        e.target.value
                                      )
                                    }
                                    placeholder="10"
                                    className="bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Description</Label>
                                  <Input
                                    value={ticket.description}
                                    onChange={(e) =>
                                      updateTicket(
                                        category.id,
                                        ticket.id,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ticket description"
                                    className="bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                              </div>

                              {/* Ticket Images and Templates */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <Label className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Ticket Banner Image
                                  </Label>
                                  {ticket.bannerPreview || ticket.banner ? (
                                    <div className="mt-2 relative">
                                      {/* 16:9 Aspect Ratio Container */}
                                      <div
                                        className="w-full relative"
                                        style={{ paddingTop: "56.25%" }}
                                      >
                                        <img
                                          src={
                                            ticket.bannerPreview ||
                                            ticket.banner
                                          }
                                          alt="Ticket Banner"
                                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                        />
                                      </div>
                                      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            removeTicketFile(
                                              category.id,
                                              ticket.id,
                                              "banner"
                                            )
                                          }
                                          className="flex-1"
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Remove
                                        </Button>
                                      </div>
                                      {ticket.bannerFile && (
                                        <p className="text-xs text-zinc-400 mt-1 truncate">
                                          {ticket.bannerFile}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-2">
                                      <label
                                        htmlFor={`ticket-banner-${category.id}-${ticket.id}`}
                                        className="border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors cursor-pointer block"
                                      >
                                        {uploadingFiles[
                                          `ticket_${category.id}_${ticket.id}_banner`
                                        ] ? (
                                          <div className="flex flex-col items-center">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                                            <p className="text-zinc-400 text-sm">
                                              Uploading...
                                            </p>
                                          </div>
                                        ) : (
                                          <>
                                            <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                                            <p className="text-zinc-400 text-sm">
                                              Upload ticket image
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                              PNG, JPG up to 5MB (16:9
                                              recommended)
                                            </p>
                                          </>
                                        )}
                                        <input
                                          id={`ticket-banner-${category.id}-${ticket.id}`}
                                          type="file"
                                          className="hidden"
                                          accept="image/jpeg,image/jpg,image/png,image/webp"
                                          onChange={(e) =>
                                            handleTicketBannerUpload(
                                              category.id,
                                              ticket.id,
                                              e
                                            )
                                          }
                                          disabled={
                                            uploadingFiles[
                                              `ticket_${category.id}_${ticket.id}_banner`
                                            ]
                                          }
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    PDF Template
                                  </Label>
                                  {ticket.pdfTemplate ? (
                                    <div className="mt-2 p-4 bg-zinc-700 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-5 w-5 text-red-400" />
                                        <p className="text-sm text-white truncate flex-1">
                                          {ticket.pdfFile || "PDF Template"}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            window.open(
                                              ticket.pdfTemplate,
                                              "_blank"
                                            )
                                          }
                                          className="flex-1"
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            removeTicketFile(
                                              category.id,
                                              ticket.id,
                                              "pdf"
                                            )
                                          }
                                          className="flex-1"
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-2">
                                      <label
                                        htmlFor={`ticket-pdf-${category.id}-${ticket.id}`}
                                        className="border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors cursor-pointer block"
                                      >
                                        {uploadingFiles[
                                          `ticket_${category.id}_${ticket.id}_pdf`
                                        ] ? (
                                          <div className="flex flex-col items-center">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                                            <p className="text-zinc-400 text-sm">
                                              Uploading...
                                            </p>
                                          </div>
                                        ) : (
                                          <>
                                            <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                                            <p className="text-zinc-400 text-sm">
                                              Upload PDF template
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                              PDF files only
                                            </p>
                                          </>
                                        )}
                                        <input
                                          id={`ticket-pdf-${category.id}-${ticket.id}`}
                                          type="file"
                                          className="hidden"
                                          accept=".pdf,application/pdf"
                                          onChange={(e) =>
                                            handleTicketPdfUpload(
                                              category.id,
                                              ticket.id,
                                              e
                                            )
                                          }
                                          disabled={
                                            uploadingFiles[
                                              `ticket_${category.id}_${ticket.id}_pdf`
                                            ]
                                          }
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Event Preview
                </CardTitle>
                <p className="text-zinc-400">
                  This is how your event will appear to customers
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-accent rounded-lg p-6 space-y-6">
                  {/* Event Header */}
                  <div className="text-center">
                    {bannerPreview || eventData.bannerImage ? (
                      <div className="max-w-screen-md mt-2 relative mx-auto mb-4">
                        {/* 16:9 Aspect Ratio Container */}
                        <div
                          className=" relative"
                          style={{ paddingTop: "56.25%" }}
                        >
                          <img
                            src={bannerPreview || eventData.bannerImage}
                            alt="Event Banner"
                            className="absolute inset-0 aspect-[16/9]  w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="border-2 border-dashed border-zinc-600 rounded-lg p-12 text-center">
                          <Upload className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                          <p className="text-sm text-zinc-400">
                            {bannerFile ? bannerFile.name : "No file chosen"}
                          </p>
                        </div>
                      </div>
                    )}
                    <h1 className="text-3xl font-bold mb-2">
                      {eventData.title || "Event Title"}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {eventData.startDate
                            ? new Date(eventData.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{eventData.startTime || "Time TBD"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{eventData.venueName || "Venue TBD"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      About This Event
                    </h3>
                    <p className="text-zinc-400">
                      {eventData.description ||
                        "Event description will appear here..."}
                    </p>
                  </div>

                  {/* Ticket Categories */}
                  {categories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Tickets</h3>
                      <div className="space-y-4">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="border border-zinc-700 rounded-lg p-4"
                          >
                            <h4 className="font-medium mb-2">
                              {category.name || "Category Name"}
                            </h4>
                            <p className="text-sm text-zinc-400 mb-3">
                              {category.description || "Category description"}
                            </p>
                            <div className="grid gap-2">
                              {category.tickets.map((ticket) => (
                                <div
                                  key={ticket.id}
                                  className="flex justify-between items-center p-2 bg-zinc-700 rounded"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {ticket.name || "Ticket Name"}
                                    </span>
                                    <p className="text-xs text-zinc-400">
                                      {ticket.description}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold">
                                      ${ticket.price || "0.00"}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                      {ticket.quantity || "0"} available
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
