"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { categoryPath } from "@/lib/seo/slugs";
import ArtistSearchInput from "@/components/search/ArtistSearchInput";

export default function ArtistFilterBar({ 
  categories, 
  cities, 
  basePath = "/artists" 
}: { 
  categories: string[], 
  cities: string[],
  basePath?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");

  const handleFilter = (queryOverride?: string, catOverride?: string, cityOverride?: string) => {
    const params = new URLSearchParams();
    const finalQ = queryOverride !== undefined ? queryOverride : q;
    const finalCat = catOverride !== undefined ? catOverride : category;
    const finalCity = cityOverride !== undefined ? cityOverride : city;

    if (finalQ) params.set("q", finalQ);
    if (finalCat) params.set("category", finalCat);
    if (finalCity) params.set("city", finalCity);
    
    if (basePath.startsWith('/category/') && finalCat) {
      router.push(`${categoryPath(finalCat)}?${params.toString()}`);
    } else {
      router.push(`${basePath}?${params.toString()}`);
    }
  };

  const onCategoryChange = (val: string) => {
    setCategory(val);
    handleFilter(q, val, city);
  };

  const onCityChange = (val: string) => {
    setCity(val);
    handleFilter(q, category, val);
  };

  return (
    <div className="filter-bar">
      <div className="filter-input-wrap">
        <ArtistSearchInput
          variant="filter"
          value={q}
          onChange={setQ}
          onSubmit={(query) => handleFilter(query)}
          placeholder="Search by name or keyword..."
          category={category || undefined}
          city={city || undefined}
          submitPath="/artists"
        />
      </div>

      <select 
        value={category} 
        onChange={(e) => onCategoryChange(e.target.value)}
        className="filter-select"
      >
        <option value="">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select 
        value={city} 
        onChange={(e) => onCityChange(e.target.value)}
        className="filter-select"
      >
        <option value="">All Cities</option>
        {cities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <button onClick={() => handleFilter()} className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '12px' }}>
        Search
      </button>
    </div>
  );
}
