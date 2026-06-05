"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NEXT_PUBLIC_GA_ID) {
      const gtag: (...args: unknown[]) => void = (window as any).gtag || (() => {});
      gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        event_label: metric.label,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        metric_id: metric.id,
        non_interaction: true,
      });
    }
  });

  return null;
}
