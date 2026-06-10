"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector
} from "recharts";

const PIE_COLORS = ["#00d2ff", "#ff4757", "#ffa502", "#20bf6b", "#45aaf2", "#a55eea", "#fd79a8", "#fdcb6e", "#00b894", "#6c5ce7", "#e17055", "#0984e3"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--text)" fontSize={14} fontWeight={700}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text2)" fontSize={13}>
        {value} ({`${(percent * 100).toFixed(1)}%`})
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0];
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px",
        padding: "0.5rem 0.75rem", fontSize: "0.82rem", color: "var(--text)"
      }}>
        <strong>{d.name}</strong>: {d.value} ({d.payload?.percent ? (d.payload.percent * 100).toFixed(1) : 0}%)
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieCard({ title, data, dataKey, colors }: { title: string; data: any[]; dataKey: string; colors?: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const total = data.reduce((sum: number, d: { value: number }) => sum + d.value, 0);
  return (
    <div className="admin-card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text)" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey="name"
              cx="50%" cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={colors?.[idx % colors.length] || PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", justifyContent: "center", marginTop: "0.5rem" }}>
          {data.map((d, idx) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text2)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "2px", background: colors?.[idx % colors.length] || PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
              {d.name}: {d.value}
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--text3)" }}>
        Total: <strong style={{ color: "var(--text)" }}>{total}</strong>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      });
  }, []);

  const s = stats;
  const hasMedia = (s?.totalArtists || 0) > 0;

  const mediaHealthData = hasMedia ? [
    { name: "Has Images", value: s.totalArtists - s.missingImages },
    { name: "Missing Images", value: s.missingImages },
  ] : [];

  const videoHealthData = hasMedia ? [
    { name: "Has Videos", value: s.totalArtists - s.missingVideos },
    { name: "Missing Videos", value: s.missingVideos },
  ] : [];

  const categoryPieData = s?.categoryBreakdown?.length
    ? s.categoryBreakdown.map((c: { category: string; total: number }) => ({ name: c.category, value: c.total }))
    : [];

  const inquiryPieData = s?.totalInquiries
    ? Object.entries(s.inquiryStatuses || {}).map(([k, v]) => ({ name: k, value: v as number }))
    : [];

  const missingBothData = hasMedia ? [
    { name: "Has Both", value: s.totalArtists - s.missingBoth },
    { name: "Missing Both", value: s.missingBoth },
  ] : [];

  if (loading) return (
    <div className="fade-in">
      <div className="admin-header">
        <h1 className="admin-title">Platform <span className="text-gold">Overview</span></h1>
        <p className="admin-subtitle">Loading statistics...</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="admin-header">
        <h1 className="admin-title">
          Platform <span className="text-gold">Overview</span>
        </h1>
        <p className="admin-subtitle">Real-time statistics from your database.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-card">
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div><div className="admin-card-label">Total Artists</div><div className="admin-card-value">{s.totalArtists?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "var(--gold)" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
          <div><div className="admin-card-label">Total Images</div><div className="admin-card-value">{s.totalImages?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#45aaf2" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></div>
          <div><div className="admin-card-label">Video Samples</div><div className="admin-card-value">{s.totalVideos?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#eb4d4b" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></div>
        </div>
        <div className="admin-card" style={{ borderColor: "rgba(255,71,87,0.3)" }}>
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><line x1="3" y1="3" x2="21" y2="21"/></svg></div>
          <div><div className="admin-card-label">Missing Images</div><div className="admin-card-value" style={{ color: "#ff4757" }}>{s.missingImages?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#ff4757", opacity: 0.08 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        </div>
        <div className="admin-card" style={{ borderColor: "rgba(255,71,87,0.3)" }}>
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="3" y1="3" x2="21" y2="21"/></svg></div>
          <div><div className="admin-card-label">Missing Videos</div><div className="admin-card-value" style={{ color: "#ff4757" }}>{s.missingVideos?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#ff4757", opacity: 0.08 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></div>
        </div>
        <div className="admin-card" style={{ borderColor: "rgba(255,71,87,0.3)" }}>
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
          <div><div className="admin-card-label">Missing Both</div><div className="admin-card-value" style={{ color: "#ff4757" }}>{s.missingBoth?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#ff4757", opacity: 0.08 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <div><div className="admin-card-label">Booking Inquiries</div><div className="admin-card-value">{s.totalInquiries?.toLocaleString()}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#20bf6b" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="22 6 23 7 22 8"/><polyline points="16 6 17 7 16 8"/><polyline points="2 6 1 7 2 8"/></svg></div>
          <div><div className="admin-card-label">Categories</div><div className="admin-card-value">{s.totalCategories}</div></div>
          <div className="admin-card-bg-icon" style={{ color: "#a55eea" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
        {mediaHealthData.length > 0 && (
          <PieCard title="📸 Image Health" data={mediaHealthData} dataKey="value" colors={["#00d2ff", "#ff4757"]} />
        )}
        {videoHealthData.length > 0 && (
          <PieCard title="🎬 Video Health" data={videoHealthData} dataKey="value" colors={["#20bf6b", "#ff4757"]} />
        )}
        {missingBothData.length > 0 && (
          <PieCard title="⚠️ Both Media Missing" data={missingBothData} dataKey="value" colors={["#ffa502", "#ff4757"]} />
        )}
        {categoryPieData.length > 0 && (
          <PieCard title="📊 Category Distribution" data={categoryPieData} dataKey="value" colors={PIE_COLORS} />
        )}
        {inquiryPieData.length > 0 && (
          <PieCard title="📬 Inquiry Status" data={inquiryPieData} dataKey="value" colors={["#00d2ff", "#ffa502", "#20bf6b"]} />
        )}
      </div>
      <div className="admin-grid-layout" style={{ marginTop: "2rem" }}>
        <div className="admin-section" style={{ overflowX: "auto" }}>
          <h3 className="admin-section-title">Category Breakdown</h3>
          <table className="admin-table" style={{ width: "100%", tableLayout: "fixed", fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ width: "32%", minWidth: "100px" }}>Category</th>
                <th style={{ textAlign: "center", width: "17%" }}>Total</th>
                <th style={{ textAlign: "center", width: "17%" }}>Miss Images</th>
                <th style={{ textAlign: "center", width: "17%" }}>Miss Videos</th>
                <th style={{ textAlign: "center", width: "17%" }}>Miss Both</th>
              </tr>
            </thead>
            <tbody>
              {s?.categoryBreakdown?.map((c: { category: string; total: number; missingImages: number; missingVideos: number; missingBoth: number }) => (
                <tr key={c.category} style={{ height: "auto" }}>
                  <td style={{ wordBreak: "break-word", overflowWrap: "break-word" }}><span className="admin-badge">{c.category}</span></td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{c.total}</td>
                  <td style={{ textAlign: "center", color: c.missingImages > 0 ? "#ff4757" : "var(--text2)" }}>{c.missingImages}</td>
                  <td style={{ textAlign: "center", color: c.missingVideos > 0 ? "#ff4757" : "var(--text2)" }}>{c.missingVideos}</td>
                  <td style={{ textAlign: "center", color: c.missingBoth > 0 ? "#ff4757" : "var(--text2)" }}>{c.missingBoth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="admin-section" style={{ marginBottom: "1.5rem" }}>
            <h3 className="admin-section-title">Quick Management</h3>
            <div className="admin-action-grid">
              <Link href="/admin/artists/new" className="admin-action-card">
                <div className="admin-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div className="admin-action-label">Add New Artist</div>
                <div className="admin-action-desc">Manual creation with full media support</div>
              </Link>
              <Link href="/admin/import" className="admin-action-card">
                <div className="admin-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div className="admin-action-label">Bulk JSON Import</div>
                <div className="admin-action-desc">Import thousands of artists at once</div>
              </Link>
            </div>
          </div>

          <div className="admin-section">
            <h3 className="admin-section-title">System Status</h3>
            <div className="admin-status-list">
              <div className="admin-status-item">
                <span className="admin-status-label">Database</span>
                <div className="admin-status-value status-healthy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Connected
                </div>
              </div>
              <div className="admin-status-item">
                <span className="admin-status-label">Auth Service</span>
                <div className="admin-status-value status-healthy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Healthy
                </div>
              </div>
              <div className="admin-status-item">
                <span className="admin-status-label">Media Storage</span>
                <div className="admin-status-value status-healthy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Operational
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
