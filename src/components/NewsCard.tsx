
import { CalendarIcon, ClockIcon } from "lucide-react";

interface NewsCardProps {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  link: string;
}

const NewsCard = ({ title, excerpt, date, readTime, image, link }: NewsCardProps) => {
  return (
    <div className="card-container rounded-lg overflow-hidden flex flex-col md:flex-row animate-fade-in-right">
      <div className="relative md:w-1/3 h-48 md:h-auto">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="p-5 md:w-2/3 flex flex-col">
        <div className="flex items-center text-xs text-gray-400 mb-3 space-x-4">
          <div className="flex items-center">
            <CalendarIcon className="w-3 h-3 mr-1" />
            <span>{date}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            <span>{readTime}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-white hover:text-matrix-primary transition-colors">
          <a href={link}>{title}</a>
        </h3>
        
        <p className="text-gray-400 mb-4 flex-grow">{excerpt}</p>
        
        <a 
          href={link} 
          className="inline-block px-4 py-2 text-sm bg-matrix-muted text-matrix-primary hover:bg-opacity-80 rounded transition-colors self-start"
        >
          Read Full Article
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
