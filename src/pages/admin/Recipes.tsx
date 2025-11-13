import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Recipe = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
};

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground mt-1">Manage product recipes and ingredients</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Recipe
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <ChefHat className="h-8 w-8 text-primary" />
                <Badge>{recipe.category}</Badge>
              </div>
              <CardTitle className="mt-4">{recipe.name}</CardTitle>
              <CardDescription>{recipe.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Created: {new Date(recipe.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recipes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No recipes yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first recipe to get started
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Recipes;
