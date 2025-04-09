import { Pet } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

interface PetCardProps {
  pet: Pet;
  onViewDetails: (pet: Pet) => void;
}

export function PetCard({ pet, onViewDetails }: PetCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatAge = (age: number, ageGroup: string) => {
    if (age < 1) {
      return `${Math.round(age * 12)} months`;
    }
    return `${age} ${age === 1 ? 'year' : 'years'}`;
  };

  // Format the pet type to capitalize first letter only
  const formatPetType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const petTypeColor: Record<string, string> = {
    'dog': 'bg-primary text-white',
    'cat': 'bg-indigo-400 text-white',
    'bird': 'bg-amber-500 text-white',
    'rabbit': 'bg-emerald-500 text-white',
    'small_animal': 'bg-blue-500 text-white',
    'other': 'bg-purple-500 text-white'
  };

  const ageGroupIcon: Record<string, string> = {
    'baby': '🍼',
    'young': '🌱',
    'adult': '🏆',
    'senior': '👑'
  };

  const getTimeAgo = (date: string | Date) => {
    const createdDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <Card 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 h-full group transform hover:-translate-y-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Animation Effect */}
      <div className="relative overflow-hidden aspect-[4/3]">
        {!isImageLoaded && !isImageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
        
        {isImageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <i className="fas fa-image text-gray-400 text-4xl mb-2"></i>
              <p className="text-gray-500 text-sm">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img 
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'} ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
            src={pet.mainImage} 
            alt={`${pet.name}, ${pet.breed}`} 
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setIsImageError(true);
              setIsImageLoaded(true);
            }}
          />
        )}
        
        {/* Decorative Element - Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-black/20 opacity-70"></div>
        
        {/* Primary Badge */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
          <Badge className={`${petTypeColor[pet.petType]} px-3 py-1 text-xs font-medium shadow-sm rounded-full transition-transform ${isHovered ? 'scale-105' : ''}`}>
            {formatPetType(pet.petType)}
          </Badge>
          
          {/* Status Tag if Available */}
          {pet.statusTag && (
            <Badge className="bg-yellow-500 text-white px-3 py-1 text-xs font-medium shadow-sm rounded-full transition-transform" 
              style={{ 
                animation: isHovered ? 'pulse 2s infinite' : 'none'
              }}
            >
              {pet.statusTag}
            </Badge>
          )}
        </div>
        
        {/* Time Indicator */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-gray-700 border-0 px-2 py-0.5 text-[10px] rounded-full flex items-center gap-1 shadow-sm">
            <Clock className="w-3 h-3" />
            {getTimeAgo(pet.createdAt)}
          </Badge>
        </div>
        
        {/* Favorite Button */}
        <button 
          className="absolute top-12 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          aria-label="Add to favorites"
          onClick={(e) => {
            e.stopPropagation();
            // Favorite functionality would go here
          }}
        >
          <Heart className="h-4 w-4 text-rose-500" />
        </button>
        
        {/* Gradient Text Container */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold text-white drop-shadow-sm transform transition-transform duration-300 group-hover:translate-x-1">
                {pet.name} <span className="text-sm opacity-90">{ageGroupIcon[pet.ageGroup]}</span>
              </h3>
              <div className="flex items-center text-white/80 text-sm mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[150px]">{pet.location}</span>
              </div>
            </div>
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20">
              ID: {pet.id}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <CardContent className="p-5">
        {/* Breed and Details */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <p className="text-gray-800 font-semibold text-base line-clamp-1" title={pet.breed}>{pet.breed}</p>
            <div className="flex gap-1">
              {/* Display a vaccinated badge if available (commented out for now) */}
              {/* {
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-1.5 h-5 rounded-sm text-[10px]">
                  <i className="fas fa-syringe mr-1 text-[8px]"></i> Vaccinated
                </Badge>
              } */}
            </div>
          </div>
          
          {/* Pet Description */}
          <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px]">
            {pet.description || `${pet.name} is a lovely ${pet.breed} looking for a forever home. ${pet.gender === 'male' ? 'He' : 'She'} is ${formatAge(pet.age, pet.ageGroup)} old.`}
          </p>
          
          {/* Pet Attributes */}
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline" className={`${pet.gender === 'male' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'} px-2 py-0.5 rounded-full text-xs`}>
              {pet.gender === 'male' ? '♂ Male' : '♀ Female'}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-2 py-0.5 rounded-full text-xs">
              {formatAge(pet.age, pet.ageGroup)}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-2 py-0.5 rounded-full text-xs">
              {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)}
            </Badge>
          </div>
        </div>
        
        {/* Divider with Paw Print */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-white px-2 text-gray-400">
              <i className="fas fa-paw text-primary/40"></i>
            </div>
          </div>
        </div>
        
        {/* View Details Button with Animation */}
        <button 
          onClick={() => onViewDetails(pet)}
          className="relative block w-full text-center bg-primary hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors font-medium shadow-sm hover:shadow group-hover:shadow-md overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center">
            <span>View Details</span>
            <i className="fas fa-arrow-right ml-2 transform transition-transform group-hover:translate-x-1"></i>
          </span>
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
          
          {/* Animated Effect on Button */}
          <span className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <span className={`absolute top-0 left-0 w-8 h-full transform -skew-x-12 bg-white ${isHovered ? 'animate-shine' : ''} opacity-20`}></span>
          </span>
        </button>
      </CardContent>
      
      {/* Animation is handled by TailwindCSS classes */}
    </Card>
  );
}
