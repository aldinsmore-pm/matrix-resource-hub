import { sanityClient } from './sanity';

export async function getAllPosts() {
  const posts = await sanityClient.fetch(`
    *[_type == "post"] {
      _id,
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt,
      "categories": categories[]->title,
      "author": author->{name, image}
    } | order(publishedAt desc)
  `);
  
  return posts;
}

export async function getPostBySlug(slug: string) {
  const post = await sanityClient.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      mainImage,
      publishedAt,
      body,
      "categories": categories[]->title,
      "author": author->{name, image, bio}
    }
  `, { slug });
  
  return post;
}

export async function getPageContent(slug: string) {
  const page = await sanityClient.fetch(`
    *[_type == "page" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      mainImage,
      content
    }
  `, { slug });
  
  return page;
} 