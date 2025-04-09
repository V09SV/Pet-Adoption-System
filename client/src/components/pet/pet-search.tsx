import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PetFilter } from "@/components/pet/pet-filter";
import { SearchPetsParams } from "@shared/schema";
import { Search } from "lucide-react";

interface PetSearchProps {
  onSearch: (params: SearchPetsParams) => void;
  initialParams?: SearchPetsParams;
}

export function PetSearch({ onSearch, initialParams }: PetSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchPetsParams>(initialParams || {
    query: "",
    petType: "",
    location: "",
    ageGroup: "",
    size: "",
    gender: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleInputChange = (key: keyof SearchPetsParams, value: string) => {
    setSearchParams((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  return (
    <div>
      <form onSubmit={handleSearchSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Pets
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                name="search"
                id="search"
                className="pl-10 shadow-sm"
                placeholder="Search by name, breed or location"
                value={searchParams.query || ""}
                onChange={(e) => handleInputChange("query", e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="animal-type" className="block text-sm font-medium text-gray-700 mb-2">
              Pet Type
            </label>
            <Select
              value={searchParams.petType || "all"}
              onValueChange={(value) => handleInputChange("petType", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Pets" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Pets</SelectItem>
                  <SelectItem value="dog">Dogs</SelectItem>
                  <SelectItem value="cat">Cats</SelectItem>
                  <SelectItem value="bird">Birds</SelectItem>
                  <SelectItem value="rabbit">Rabbits</SelectItem>
                  <SelectItem value="small_animal">Small Animals</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <Select
              value={searchParams.location || "all"}
              onValueChange={(value) => handleInputChange("location", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="new-york">New York</SelectItem>
                  <SelectItem value="los-angeles">Los Angeles</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                  <SelectItem value="houston">Houston</SelectItem>
                  <SelectItem value="phoenix">Phoenix</SelectItem>
                  <SelectItem value="boston">Boston</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-4 flex justify-between items-center mt-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={toggleAdvancedFilters} 
              className="text-primary hover:text-indigo-700 text-sm font-medium flex items-center"
            >
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters 
              <i className={`fas fa-chevron-${showAdvancedFilters ? 'up' : 'down'} ml-1`}></i>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-indigo-700 text-white shadow-md"
            >
              Find Pets
            </Button>
          </div>
        </div>
        
        {showAdvancedFilters && (
          <PetFilter 
            params={searchParams} 
            onChange={(key, value) => handleInputChange(key as keyof SearchPetsParams, value)}
          />
        )}
      </form>
    </div>
  );
}
