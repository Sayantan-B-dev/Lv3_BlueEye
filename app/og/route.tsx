import { ImageResponse } from "next/og";

export const runtime = "edge";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
  "Netlify-CDN-Cache-Control": "public, s-maxage=31536000, immutable",
  "CDN-Cache-Control": "public, s-maxage=31536000, immutable",
  "X-Robots-Tag": "noindex, nofollow",
};

const IMAGE_HOSTS = new Set(["ik.imagekit.io", "i0.wp.com", "images.unsplash.com"]);

async function safeImageUrl(raw: string): Promise<string | null> {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !IMAGE_HOSTS.has(url.hostname)) return null;
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = (searchParams.get("title") || "Blue Eye Entertainment").slice(0, 120);
    const description = (searchParams.get("description") || "").slice(0, 200);
    const requestedImage = searchParams.get("image") || "";
    const type = searchParams.get("type") || "default";
    const category = (searchParams.get("category") || "").slice(0, 40);

    const gold = "#d4a017";
    const saffron = "#f59e0b";
    const bg = "#0a0807";
    const text = "#f5f0eb";
    const muted = "#9ca3af";

    const showImage = Boolean(requestedImage) && type === "artist";
    const imageUrl = showImage ? await safeImageUrl(requestedImage) : null;
    const renderImage = showImage && imageUrl !== null;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${bg} 0%, #1a0f0a 50%, ${bg} 100%)`,
            color: text,
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(${gold}11 1px, transparent 1px), linear-gradient(90deg, ${gold}11 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Gold accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              background: `linear-gradient(90deg, ${gold}, ${saffron}, ${gold})`,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: renderImage ? "60px" : "0",
              padding: "60px 80px",
              width: "100%",
              maxWidth: "1000px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: renderImage ? 1.5 : 1,
                maxWidth: renderImage ? "600px" : "900px",
              }}
            >
              {/* Logo + Brand */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    border: `2px solid ${gold}`,
                    background: "#120c08",
                    color: gold,
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  BE
                </div>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    color: gold,
                    letterSpacing: "0.5px",
                  }}
                >
                  BLUE EYE ENTERTAINMENT
                </span>
              </div>

              {category && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      background: `${gold}22`,
                      color: gold,
                      padding: "4px 14px",
                      borderRadius: "100px",
                      fontSize: 18,
                      fontWeight: 700,
                      border: `1px solid ${gold}44`,
                    }}
                  >
                    {category.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1
                style={{
                  fontSize: renderImage ? 48 : 56,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  margin: "0 0 12px 0",
                  color: text,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </h1>

              {/* Description */}
              {description && (
                <p
                  style={{
                    fontSize: 22,
                    color: muted,
                    lineHeight: 1.5,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {description}
                </p>
              )}

              {/* Bottom tagline */}
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: 16,
                  color: muted,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: gold, display: "flex" }} />
                India&apos;s Premium Artist Booking Platform
              </div>
            </div>

            {/* Artist image (right side) */}
            {renderImage && imageUrl && (
              <div
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `3px solid ${gold}33`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1a1a1a",
                }}
              >
                <img
                  src={imageUrl}
                  alt=""
                  width={280}
                  height={280}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0807",
            color: "#f5f0eb",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          Blue Eye Entertainment
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "Netlify-CDN-Cache-Control": "public, s-maxage=300",
          "CDN-Cache-Control": "public, s-maxage=300",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  }
}
