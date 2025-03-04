import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllPosts } from '../lib/cms';
import { urlFor } from '../lib/sanity';

export default function BlogPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const allPosts = await getAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (posts.length === 0) {
    return <div>No posts found.</div>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <div key={post._id} className="post-card">
          {post.mainImage && (
            <div className="post-image">
              <img 
                src={urlFor(post.mainImage).width(300).url()} 
                alt={post.title} 
              />
            </div>
          )}
          
          <div className="post-content">
            <h2 className="post-title">
              <Link href={`/blog/${post.slug.current}`}>
                {post.title}
              </Link>
            </h2>
            
            <div className="post-meta">
              {post.author && (
                <span className="post-author">
                  By {post.author.name}
                </span>
              )}
              
              <span className="post-date">
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            </div>
            
            {post.excerpt && (
              <p className="post-excerpt">{post.excerpt}</p>
            )}
            
            <Link href={`/blog/${post.slug.current}`} className="read-more">
              Read More
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
} 