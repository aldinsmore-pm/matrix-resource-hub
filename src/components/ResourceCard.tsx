
import { ArrowUpRight } from "lucide-react";

interface ResourceCardProps {
  title: string;
  description: string;
  category: string;
  image: string;
  link: string;
}

const ResourceCard = ({ title, description, category, image, link }: ResourceCardProps) => {
  return (
    <div className="card-container rounded-lg overflow-hidden h-full flex flex-col group animate-scale-up">
      <div className="relative overflow-hidden h-48">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-matrix-bg to-transparent"></div>
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-matrix-muted bg-opacity-80 rounded-full text-xs font-semibold text-matrix-primary">
            {category}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-sm mb-4 flex-grow">{description}</p>
        
        <a 
          href={link} 
          className="inline-flex items-center text-matrix-primary hover:text-matrix-secondary transition-colors group mt-auto"
        >
          <span>Explore Resource</span>
          <ArrowUpRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </a>
      </div>
    </div>
  );
};

export default ResourceCard;
