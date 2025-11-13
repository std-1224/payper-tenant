import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [venue, setVenue] = useState<any>(null);
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenueData();
  }, [id]);

  const fetchVenueData = async () => {
    try {
      const [venueRes, barsRes] = await Promise.all([
        supabase.from("venues").select("*").eq("id", id).single(),
        supabase.from("venue_bars").select("*").eq("venue_id", id),
      ]);

      if (venueRes.error) throw venueRes.error;
      if (barsRes.error) throw barsRes.error;

      setVenue(venueRes.data);
      setBars(barsRes.data || []);
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!venue) {
    return <div className="text-center py-8">Venue not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/venues")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{venue.name}</h1>
          <p className="text-muted-foreground mt-1">Venue details and management</p>
        </div>
        <Badge>{venue.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Venue Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">{venue.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Connection</p>
              <p className="text-sm text-muted-foreground">
                {venue.is_offline ? "Offline" : "Online"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-sm text-muted-foreground">
                {venue.last_sync
                  ? new Date(venue.last_sync).toLocaleString()
                  : "Never synced"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bars ({bars.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bars.map((bar) => (
                <div
                  key={bar.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{bar.name}</span>
                  </div>
                  <Badge variant="secondary">{bar.status}</Badge>
                </div>
              ))}
              {bars.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bars configured
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VenueDetail;
