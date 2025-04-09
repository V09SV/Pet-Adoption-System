import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchPetsParams } from "@shared/schema";

interface PetFilterProps {
  params: SearchPetsParams;
  onChange: (key: string, value: string) => void;
}

export function PetFilter({ params, onChange }: PetFilterProps) {
  return (
    <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
        <Select
          value={params.ageGroup || "any"}
          onValueChange={(value) => onChange("ageGroup", value === "any" ? "" : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="baby">Baby</SelectItem>
              <SelectItem value="young">Young</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Size</label>
        <Select
          value={params.size || "any"}
          onValueChange={(value) => onChange("size", value === "any" ? "" : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="xlarge">Extra Large</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
        <Select
          value={params.gender || "any"}
          onValueChange={(value) => onChange("gender", value === "any" ? "" : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
