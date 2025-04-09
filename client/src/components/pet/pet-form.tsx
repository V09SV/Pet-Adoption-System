import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertPetSchema, Pet } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { getRandomPetImage } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Extend the schema for form validation
const petFormSchema = insertPetSchema.extend({
  additionalImagesInput: z.string().optional(),
}).omit({ additionalImages: true });

type PetFormData = z.infer<typeof petFormSchema>;

interface PetFormProps {
  pet?: Pet | null;
  onSaved: () => void;
}

export function PetForm({ pet, onSaved }: PetFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savePetMutation = useMutation({
    mutationFn: async (data: PetFormData) => {
      // Convert additional images from comma-separated string to array
      const formattedData = {
        ...data,
        additionalImages: data.additionalImagesInput 
          ? data.additionalImagesInput.split(',').map(url => url.trim()) 
          : [],
      };

      // Omit the additionalImagesInput field
      const { additionalImagesInput, ...finalData } = formattedData;

      if (pet) {
        // Update existing pet
        const res = await apiRequest("PATCH", `/api/pets/${pet.id}`, finalData);
        return res.json();
      } else {
        // Create new pet
        const res = await apiRequest("POST", "/api/pets", finalData);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: pet ? "Pet updated" : "Pet added",
        description: pet 
          ? `${pet.name} has been updated successfully.` 
          : "Your pet has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pets/user"] });
      onSaved();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Default values when editing
  const defaultValues: Partial<PetFormData> = pet
    ? {
        name: pet.name,
        petType: pet.petType,
        breed: pet.breed,
        gender: pet.gender,
        age: pet.age,
        ageGroup: pet.ageGroup,
        size: pet.size,
        location: pet.location,
        description: pet.description,
        goodWithChildren: pet.goodWithChildren,
        goodWithDogs: pet.goodWithDogs,
        goodWithCats: pet.goodWithCats,
        mainImage: pet.mainImage,
        additionalImagesInput: pet.additionalImages?.join(', ') || '',
        statusTag: pet.statusTag || '',
      }
    : {
        name: "",
        petType: "dog",
        breed: "",
        gender: "male",
        age: 1,
        ageGroup: "young",
        size: "medium",
        location: user?.location || "",
        description: "",
        goodWithChildren: false,
        goodWithDogs: false,
        goodWithCats: false,
        mainImage: "",
        additionalImagesInput: "",
        statusTag: "",
      };

  const form = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: PetFormData) => {
    setIsSubmitting(true);
    
    // If no main image is provided, use a random one based on pet type
    if (!data.mainImage) {
      data.mainImage = getRandomPetImage(data.petType);
    }
    
    savePetMutation.mutate(data);
  };

  const selectedPetType = form.watch("petType");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter pet name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Type*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dog">Dog</SelectItem>
                        <SelectItem value="cat">Cat</SelectItem>
                        <SelectItem value="bird">Bird</SelectItem>
                        <SelectItem value="rabbit">Rabbit</SelectItem>
                        <SelectItem value="small_animal">Small Animal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Enter ${selectedPetType} breed`} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.1} 
                        placeholder="Age in years" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ageGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Group*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baby">Baby</SelectItem>
                        <SelectItem value="young">Young</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="xlarge">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location*</FormLabel>
                  <FormControl>
                    <Input placeholder="City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statusTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Friendly, Trained, Playful" {...field} />
                  </FormControl>
                  <FormDescription>
                    A short tag that describes your pet's key characteristic
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your pet, their personality, and needs" 
                      className="min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium">Good With</p>
              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="goodWithChildren"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Children</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goodWithDogs"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Dogs</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goodWithCats"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cats</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="mainImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter image URL" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to use a default image based on pet type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalImagesInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Images</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter image URLs separated by commas" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Add multiple image URLs separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSaved}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {pet ? "Updating" : "Saving"}...
              </>
            ) : (
              pet ? "Update Pet" : "Add Pet"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
