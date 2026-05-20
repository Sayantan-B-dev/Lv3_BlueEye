import { MetadataRoute } from 'next';
import { getArtists } from '@/lib/services/artistService';
import { siteConfig } from '@/lib/config/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteConfig.url) {
    return [];
  }
  
  const baseUrl = siteConfig.url;
  
  // Fetch artists for dynamic routes
  let artistUrls: any[] = [];
  try {
    const response = await getArtists({ limit: 1000 }) as { artists: any[] };
    const artists = response?.artists || [];
    
    artistUrls = artists.map((artist) => ({
      url: `${baseUrl}/artists/${artist.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Failed to fetch artists for sitemap:", error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/book-artist`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...artistUrls,
  ];
}
