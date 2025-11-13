import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Building2 } from "lucide-react";

type Bar = {
  id: string;
  name: string;
  status: string;
  venues: { name: string } | null;
};

type QRCode = {
  id: string;
  table_number: string;
  qr_code: string;
  is_active: boolean;
  venue_bars: { name: string } | null;
};

const Bars = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [barsRes, qrRes] = await Promise.all([
        supabase.from("venue_bars").select("*, venues(name)").order("name"),
        supabase.from("qr_codes").select("*, venue_bars(name)").order("table_number"),
      ]);

      if (barsRes.error) throw barsRes.error;
      if (qrRes.error) throw qrRes.error;

      setBars(barsRes.data || []);
      setQrCodes(qrRes.data || []);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bars & QR Codes</h1>
        <p className="text-muted-foreground mt-1">Manage bars and table QR codes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Bars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bars.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Active QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qrCodes.filter((qr) => qr.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bars</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bar Name</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bars.map((bar) => (
                <TableRow key={bar.id}>
                  <TableCell className="font-medium">{bar.name}</TableCell>
                  <TableCell>{bar.venues?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={bar.status === "active" ? "default" : "secondary"}>
                      {bar.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Bar</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-medium">{qr.table_number}</TableCell>
                  <TableCell>{qr.venue_bars?.name || "N/A"}</TableCell>
                  <TableCell className="font-mono text-xs">{qr.qr_code}</TableCell>
                  <TableCell>
                    <Badge variant={qr.is_active ? "default" : "secondary"}>
                      {qr.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bars;
