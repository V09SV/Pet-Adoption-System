import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PetCard } from "@/components/pet/pet-card";
import { PetSearch } from "@/components/pet/pet-search";
import { PetDetailsModal } from "@/components/pet/pet-details-modal";
import { Pet, SearchPetsParams, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Pagination } from "@/components/ui/pagination";

export default function FindPetsPage() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<SearchPetsParams>({
    page: 1,
    limit: 12,
  });
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse URL parameters on page load
  useEffect(() => {
    if (location.includes('?')) {
      const queryParams = new URLSearchParams(location.split('?')[1]);
      const params: SearchPetsParams = {
        page: 1,
        limit: 12,
      };
      
      if (queryParams.get('query')) params.query = queryParams.get('query') || undefined;
      if (queryParams.get('petType')) params.petType = queryParams.get('petType') || undefined;
      if (queryParams.get('location')) params.location = queryParams.get('location') || undefined;
      if (queryParams.get('ageGroup')) params.ageGroup = queryParams.get('ageGroup') || undefined;
      if (queryParams.get('size')) params.size = queryParams.get('size') || undefined;
      if (queryParams.get('gender')) params.gender = queryParams.get('gender') || undefined;
      if (queryParams.get('page')) params.page = Number(queryParams.get('page')) || 1;
      
      setSearchParams(params);
    }
  }, [location]);

  // Query for pets based on search params
  const { data: petsData, isLoading } = useQuery<{
    pets: Pet[];
    totalCount: number;
    totalPages: number;
  }>({
    queryKey: ['/api/pets/search', searchParams],
  });

  // Query for pet owners
  const { data: petOwners = {} } = useQuery<Record<number, User>>({
    queryKey: ["/api/users/pet-owners"],
    enabled: !!petsData?.pets && petsData.pets.length > 0,
  });

  const handleSearch = (params: SearchPetsParams) => {
    setSearchParams({
      ...params,
      page: 1,
      limit: 12,
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({
      ...searchParams,
      page,
    });
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (pet: Pet) => {
    setSelectedPet(pet);
    setIsModalOpen(true);
  };

  // Get the selected pet's owner
  const selectedPetOwner = selectedPet ? petOwners[selectedPet.ownerId] : null;

  const pets = petsData?.pets || [];
  const totalPages = petsData?.totalPages || 1;
  const currentPage = searchParams.page || 1;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        {/* Page Title */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Pet</h1>
            <p className="mt-2 text-gray-600">Browse through our available pets and find your new companion</p>
          </div>
        </div>
        
        {/* Search Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Find Your Perfect Pet</h3>
            <PetSearch onSearch={handleSearch} initialParams={searchParams} />
          </div>
        </div>
        
        {/* Pet Listing Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 pb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? 'Loading pets...' : 
                pets.length === 0 ? 'No pets found' : 
                `${petsData?.totalCount || 0} Pets Found`
              }
            </h2>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Sort by:</span>
              <select className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                <option>Newest</option>
                <option>Closest</option>
                <option>Recently Updated</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : pets.length === 0 ? (
            // No results
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <i className="fas fa-search text-gray-400 text-3xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search filters or browse all available pets.</p>
              <Button 
                onClick={() => handleSearch({})}
                className="bg-primary hover:bg-indigo-700 text-white"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            // Pet cards
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </main>
      
      <Footer />
      
      {/* Pet Details Modal */}
      {selectedPet && (
        <PetDetailsModal
          pet={selectedPet}
          owner={selectedPetOwner}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
