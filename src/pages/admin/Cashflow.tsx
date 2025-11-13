import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

type CashflowEntry = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  created_at: string;
  venues: { name: string } | null;
  venue_bars: { name: string } | null;
};

const Cashflow = () => {
  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCashflow();
  }, []);

  const fetchCashflow = async () => {
    try {
      const { data, error } = await supabase
        .from("venue_cashflow")
        .select("*, venues(name), venue_bars(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);
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

  const totalIn = entries
    .filter((e) => e.type === "in")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalOut = entries
    .filter((e) => e.type === "out")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const netBalance = totalIn - totalOut;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cashflow</h1>
        <p className="text-muted-foreground mt-1">Track financial movements and balances</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalIn.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Total Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalOut.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-500" : "text-destructive"}`}>
              ${netBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Bar</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant={entry.type === "in" ? "default" : "destructive"}>
                      {entry.type === "in" ? "Income" : "Expense"}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.venues?.name || "N/A"}</TableCell>
                  <TableCell>{entry.venue_bars?.name || "N/A"}</TableCell>
                  <TableCell className={entry.type === "in" ? "text-green-500" : "text-destructive"}>
                    ${Number(entry.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{entry.note || "-"}</TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cashflow;
