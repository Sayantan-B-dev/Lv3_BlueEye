# Project Structure

```text
BlueEye/
├── app/
│   ├── admin/                 # Admin Dashboard
│   │   ├── (dashboard)/
│   │   │   ├── artists/       # Artist Management
│   │   │   │   └── [id]/edit/ # Artist Editor
│   │   │   ├── inquiries/     # Inquiry Management
│   │   │   ├── import/        # JSON Import
│   │   │   ├── layout.tsx     # Admin Layout + Sidebar
│   │   │   └── page.tsx       # Stats Overview
│   │   └── login/             # Admin Login
│   ├── api/                   # Backend APIs
│   │   ├── admin/
│   │   │   ├── inquiries/     # Inquiry Status Patching
│   │   │   └── stats/         # Admin Analytics
│   │   ├── artists/           # Public Artist APIs
│   │   │   └── id/            # ID-based retrieval
│   │   ├── inquiries/         # Public Inquiry POST
│   │   ├── search/            # Keyword/Filter Search
│   │   └── stats/             # Public Home Stats
│   ├── about/                 # About Page
│   ├── artists/               # All Artists Page
│   ├── book-artist/           # Artist Booking Page
│   ├── category/              # Category Browsing
│   ├── city/                  # City Browsing
│   ├── profile/               # Artist Profile View
│   ├── search/                # Search Results
│   └── layout.tsx             # Root Layout
├── components/
│   ├── admin/                 # Admin UI Components
│   │   └── AdminSidebar.tsx   # Dynamic Sidebar
│   ├── auth/                  # Auth Providers
│   ├── home/                  # Homepage Sections
│   │   ├── HeroSection.tsx    # SVG icons + Search
│   │   └── StatsBar.tsx       # Real-time Stats
│   ├── layout/                # Global Layout
│   │   ├── Navbar.tsx         # Glassmorphism + Branding
│   │   └── Footer.tsx         # Site Footer
│   └── ui/                    # Reusable UI
│       ├── ArtistCard.tsx
│       └── ArtistFilterBar.tsx # Directory Filters
├── docs/                      # Documentation
├── lib/
│   ├── auth/                  # Auth Config
│   ├── config/                # Site Config (site.ts)
│   ├── db/                    # DB Connection
│   ├── models/                # Mongoose Models
│   ├── services/              # Business Logic
│   └── utils/                 # Helpers
├── public/                    # Assets
└── styles/                    # CSS (globals.css)
```