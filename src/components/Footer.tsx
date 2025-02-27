
import { Twitter, Linkedin, Github, Mail, ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-matrix-bg-alt py-16 border-t border-matrix-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <a href="/" className="inline-block mb-4">
              <span className="text-xl font-bold text-matrix-primary text-glow">MATRIX<span className="text-white">AI</span></span>
            </a>
            <p className="text-gray-400 mb-4 text-sm">
              Empowering enterprises with cutting-edge AI resources, guides, and news to transform their operations.
            </p>
            <div className="flex space-x-4">
              <SocialLink href="#" icon={<Twitter size={18} />} />
              <SocialLink href="#" icon={<Linkedin size={18} />} />
              <SocialLink href="#" icon={<Github size={18} />} />
              <SocialLink href="#" icon={<Mail size={18} />} />
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <FooterLinkGroup>
              <FooterLink href="#">Implementation Guides</FooterLink>
              <FooterLink href="#">AI Use Cases</FooterLink>
              <FooterLink href="#">Templates</FooterLink>
              <FooterLink href="#">Whitepapers</FooterLink>
            </FooterLinkGroup>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <FooterLinkGroup>
              <FooterLink href="#">About Us</FooterLink>
              <FooterLink href="#">Our Team</FooterLink>
              <FooterLink href="#">Careers</FooterLink>
              <FooterLink href="#">Contact</FooterLink>
            </FooterLinkGroup>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Subscribe to Our Newsletter</h4>
            <p className="text-gray-400 mb-4 text-sm">
              Get the latest AI news and resources delivered to your inbox weekly.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-matrix-muted border border-matrix-border text-white px-4 py-2 rounded-l-md w-full focus:outline-none focus:border-matrix-primary"
              />
              <button className="bg-matrix-primary text-black px-3 py-2 rounded-r-md hover:bg-opacity-90 transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-matrix-border flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} MatrixAI. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-matrix-primary text-sm">Terms</a>
            <a href="#" className="text-gray-400 hover:text-matrix-primary text-sm">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-matrix-primary text-sm">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => {
  return (
    <a 
      href={href} 
      className="w-8 h-8 rounded-full bg-matrix-muted flex items-center justify-center text-gray-400 hover:text-matrix-primary hover:bg-opacity-80 transition-colors"
    >
      {icon}
    </a>
  );
};

const FooterLinkGroup = ({ children }: { children: React.ReactNode }) => {
  return <ul className="space-y-2">{children}</ul>;
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <li>
      <a 
        href={href} 
        className="text-gray-400 hover:text-matrix-primary transition-colors text-sm"
      >
        {children}
      </a>
    </li>
  );
};

export default Footer;
