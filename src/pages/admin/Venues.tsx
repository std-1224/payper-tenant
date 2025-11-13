import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, WifiOff, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Venue = {
  id: string;
  name: string;
  status: string;
  last_sync: string | null;
  is_offline: boolean;
  created_at: string;
};

const Venues = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      onboarding: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground mt-1">Manage all venue locations</p>
        </div>
        <Button onClick={() => navigate("/admin/venues/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Venue
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card
            key={venue.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/admin/venues/${venue.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <Building2 className="h-8 w-8 text-primary" />
                <div className="flex items-center gap-2">
                  {venue.is_offline ? (
                    <WifiOff className="h-4 w-4 text-destructive" />
                  ) : (
                    <Wifi className="h-4 w-4 text-green-500" />
                  )}
                  {getStatusBadge(venue.status)}
                </div>
              </div>
              <CardTitle className="mt-4">{venue.name}</CardTitle>
              <CardDescription>
                {venue.last_sync
                  ? `Last sync: ${new Date(venue.last_sync).toLocaleString()}`
                  : "Never synced"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Created: {new Date(venue.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {venues.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No venues yet</p>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first venue</p>
            <Button onClick={() => navigate("/admin/venues/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Venues;
