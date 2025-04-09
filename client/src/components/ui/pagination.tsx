import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust range to always show 3 pages if possible
    if (rangeEnd - rangeStart < 2 && totalPages > 3) {
      if (rangeStart === 2) {
        rangeEnd = Math.min(4, totalPages - 1);
      } else if (rangeEnd === totalPages - 1) {
        rangeStart = Math.max(2, totalPages - 3);
      }
    }
    
    // Add ellipsis before range if needed
    if (rangeStart > 2) {
      pages.push('ellipsis-start');
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis after range if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis-end');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  const pages = getPageNumbers();

  return (
    <nav className={cn("relative z-0 inline-flex rounded-md shadow-sm -space-x-px", className)} aria-label="Pagination">
      <Button
        variant="outline"
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <span className="sr-only">Previous</span>
        <i className="fas fa-chevron-left"></i>
      </Button>
      
      {pages.map((page, index) => {
        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
            >
              ...
            </span>
          );
        }
        
        const isCurrentPage = page === currentPage;
        
        return (
          <Button
            key={page}
            variant={isCurrentPage ? "default" : "outline"}
            className={cn(
              "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
              isCurrentPage 
                ? "border-primary bg-primary text-white" 
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => typeof page === 'number' && onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span className="sr-only">Next</span>
        <i className="fas fa-chevron-right"></i>
      </Button>
    </nav>
  );
}
