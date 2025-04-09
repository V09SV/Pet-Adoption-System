import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pet, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface PetDetailsModalProps {
  pet: Pet | null;
  owner: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PetDetailsModal({ pet, owner, isOpen, onClose }: PetDetailsModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { petId: number, content: string }) => {
      if (!user?.id || !owner?.id) {
        throw new Error("Missing user or owner information");
      }
      
      const res = await apiRequest("POST", "/api/conversations", {
        petId: data.petId,
        adopterId: user.id,
        ownerId: owner.id,
        title: `Inquiry about ${pet?.name}`
      });
      const conversation = await res.json();

      const messageRes = await apiRequest("POST", "/api/messages", {
        conversationId: conversation.id,
        content: data.content
      });
      return messageRes.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: `Your inquiry about ${pet?.name} has been sent to the owner.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const contactOwner = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login or sign up to contact pet owners.",
        variant: "destructive",
      });
      return;
    }

    if (pet && owner && owner.id) { // Make sure owner.id is defined
      sendMessageMutation.mutate({
        petId: pet.id,
        content: `Hi, I'm interested in adopting ${pet.name}. Could you please provide more information?`
      });
      onClose();
    } else {
      toast({
        title: "Error",
        description: "Could not contact the owner. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (!pet) return null;

  const mainImageUrl = selectedImage || pet.mainImage;

  // Format age properly
  const formatAge = (age: number) => {
    if (age < 1) {
      return `${Math.round(age * 12)} months`;
    }
    return `${age} ${age === 1 ? 'year' : 'years'}`;
  };

  // Format pet characteristics
  const formatPetType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace('_', ' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Pet Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Pet Images */}
          <div className="space-y-4">
            <div className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <img 
                src={mainImageUrl} 
                alt={`${pet.name}, ${pet.breed} - Main Photo`} 
                className="w-full h-full object-cover"
              />
            </div>
            {pet.additionalImages && pet.additionalImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <div 
                  className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden cursor-pointer" 
                  onClick={() => setSelectedImage(pet.mainImage)}
                >
                  <img 
                    src={pet.mainImage} 
                    alt={`${pet.name}, ${pet.breed} - Main Photo`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                {pet.additionalImages.map((image, index) => (
                  <div 
                    key={index} 
                    className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={image} 
                      alt={`${pet.name}, ${pet.breed} - Additional Photo ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pet Info */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
                <p className="text-gray-600">{pet.breed}</p>
              </div>
              <Badge className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {formatPetType(pet.petType)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-600 text-sm">Age</span>
                <p className="font-medium text-gray-900">{formatAge(pet.age)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-600 text-sm">Gender</span>
                <p className="font-medium text-gray-900">{pet.gender === 'male' ? 'Male' : 'Female'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-600 text-sm">Size</span>
                <p className="font-medium text-gray-900">{pet.size.charAt(0).toUpperCase() + pet.size.slice(1)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-600 text-sm">Location</span>
                <p className="font-medium text-gray-900">{pet.location}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-2">About {pet.name}</h3>
              <p className="text-gray-600 mb-4">{pet.description}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-2">Good With</h3>
              <div className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${pet.goodWithChildren ? 'bg-indigo-100' : 'bg-gray-100'} flex items-center justify-center mb-1`}>
                    <i className={`fas fa-child ${pet.goodWithChildren ? 'text-primary' : 'text-gray-400'}`}></i>
                  </div>
                  <span className={`text-xs ${pet.goodWithChildren ? 'text-gray-600' : 'text-gray-400'}`}>Children</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${pet.goodWithDogs ? 'bg-indigo-100' : 'bg-gray-100'} flex items-center justify-center mb-1`}>
                    <i className={`fas fa-dog ${pet.goodWithDogs ? 'text-primary' : 'text-gray-400'}`}></i>
                  </div>
                  <span className={`text-xs ${pet.goodWithDogs ? 'text-gray-600' : 'text-gray-400'}`}>Dogs</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${pet.goodWithCats ? 'bg-indigo-100' : 'bg-gray-100'} flex items-center justify-center mb-1`}>
                    <i className={`fas fa-cat ${pet.goodWithCats ? 'text-primary' : 'text-gray-400'}`}></i>
                  </div>
                  <span className={`text-xs ${pet.goodWithCats ? 'text-gray-600' : 'text-gray-400'}`}>Cats</span>
                </div>
              </div>
            </div>
            
            {owner && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Contact Information</h3>
                <div className="flex items-center mb-2">
                  <Avatar className="h-10 w-10 mr-3">
                    {owner.avatar && <AvatarImage src={owner.avatar} alt={owner.name} />}
                    <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{owner.name}</p>
                    <p className="text-sm text-gray-600">Pet Owner</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button 
                onClick={contactOwner}
                className="flex-1 bg-primary hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors font-medium flex items-center justify-center"
              >
                <i className="fas fa-envelope mr-2"></i> Contact About {pet.name}
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border border-primary text-primary hover:bg-indigo-50 py-2 px-4 rounded-md transition-colors font-medium flex items-center justify-center"
              >
                <i className="fas fa-heart mr-2"></i> Save to Favorites
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
