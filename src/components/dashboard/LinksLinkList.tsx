
import { Link } from "lucide-react";

const LinksLinkList = () => {
  // You can later fetch these from Supabase if needed
  const links = [
    {
      id: 1,
      title: "OpenAI Documentation",
      url: "https://platform.openai.com/docs/",
      category: "AI Development"
    },
    {
      id: 2,
      title: "Hugging Face",
      url: "https://huggingface.co/",
      category: "AI Models"
    },
    {
      id: 3,
      title: "AI Research Papers",
      url: "https://arxiv.org/list/cs.AI/recent",
      category: "Research"
    },
    {
      id: 4,
      title: "TensorFlow Documentation",
      url: "https://www.tensorflow.org/",
      category: "Framework"
    },
    {
      id: 5,
      title: "PyTorch Tutorials",
      url: "https://pytorch.org/tutorials/",
      category: "Framework"
    }
  ];

  return (
    <div>
      <div className="flex items-center mb-4">
        <Link className="mr-2 text-matrix-primary" size={18} />
        <h3 className="text-lg font-semibold pipboy-text">Useful Links</h3>
      </div>
      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 border border-matrix-border/40 rounded-md hover:bg-matrix-bg-alt hover:border-matrix-primary/50 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-white mb-1 pipboy-text">{link.title}</h4>
                <div className="text-xs text-gray-500 pipboy-text">{link.category}</div>
              </div>
              <div className="text-xs px-2 py-1 bg-matrix-muted rounded text-matrix-primary pipboy-text">
                External
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LinksLinkList;
