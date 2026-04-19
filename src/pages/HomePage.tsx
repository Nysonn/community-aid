import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import { saveRequestsToCache, getCachedRequests } from "../offline/db";
import RequestCard from "../components/requests/RequestCard";
import CreateRequestModal from "../components/requests/CreateRequestModal";
import type { EmergencyRequest } from "../types";

const TYPES = ["", "medical", "food", "rescue", "shelter"] as const;
const STATUSES = ["", "pending", "approved", "rejected", "closed"] as const;

const RequestCardSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-card animate-pulse">
    <div className="h-[3px] w-full bg-gray-200" />
    <div className="p-5 flex flex-col gap-3 flex-1">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
      <div className="space-y-1.5">
        <div className="h-3.5 bg-gray-100 rounded-full" />
        <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
      </div>
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      <div className="mt-auto h-8 bg-gray-100 rounded-xl" />
    </div>
  </div>
);

const HomePage = () => {
  const { isSignedIn, isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedRequests, setCachedRequests] = useState<EmergencyRequest[] | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      getCachedRequests().then(setCachedRequests).catch(() => setCachedRequests([]));
    }
  }, [isOnline]);

  const { data: apiRequests, isLoading, isError } = useRequests(
    isOnline
      ? {
          ...(typeFilter && { type: typeFilter }),
          ...(statusFilter && { status: statusFilter }),
          ...(locationFilter && { location_name: locationFilter }),
        }
      : undefined
  );

  useEffect(() => {
    if (apiRequests && apiRequests.length > 0) saveRequestsToCache(apiRequests);
  }, [apiRequests]);

  const requests = isOnline ? (apiRequests ?? []) : (cachedRequests ?? []);
  const isCached = !isOnline && cachedRequests !== null;
  const isLoading_ = isLoading && isOnline;
  const isCommunityMember = isSignedIn && user?.role !== "admin";
  const hasActiveFilters = typeFilter || statusFilter || locationFilter;

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ minHeight: "clamp(620px, 94vh, 920px)" }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/df3lhzzy7/image/upload/v1775554557/pexels-rdne-6647115_lxnhbv.jpg')",
          }}
          aria-hidden="true"
        />

        {/* Primary dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, rgba(5,14,38,0.91) 0%, rgba(10,28,65,0.80) 50%, rgba(5,14,38,0.94) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Radial spotlight — draws focus to content */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 50% 42%, rgba(24,95,165,0.22) 0%, transparent 72%)",
          }}
          aria-hidden="true"
        />

        {/* Decorative blur orb — top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-100px",
            left: "-80px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(24,95,165,0.28) 0%, transparent 68%)",
            filter: "blur(50px)",
          }}
          aria-hidden="true"
        />

        {/* Decorative blur orb — bottom-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "80px",
            right: "-60px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 68%)",
            filter: "blur(50px)",
          }}
          aria-hidden="true"
        />

        {/* ── Content ── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="flex flex-col items-center text-center">

            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-[9px] rounded-full mb-7 sm:mb-8"
              style={{
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.20)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
              }}
            >
              <span className="relative flex h-[7px] w-[7px] shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                  style={{ background: "#4ade80" }}
                />
                <span
                  className="relative inline-flex rounded-full h-[7px] w-[7px]"
                  style={{ background: "#22c55e" }}
                />
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Live Emergency Response Platform
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-extrabold text-center mb-5 sm:mb-6 w-full"
              style={{
                fontSize: "clamp(38px, 6.2vw, 74px)",
                letterSpacing: "-2px",
                lineHeight: 1.07,
                color: "#ffffff",
                maxWidth: "920px",
                textShadow: "0 2px 28px rgba(0,0,0,0.40)",
              }}
            >
              Emergency Response{" "}
              <br className="hidden sm:block" />
              for{" "}
              <span
                style={{
                  color: "#60a5fa",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Ugandan
                {/* Gradient underline accent */}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    bottom: "-3px",
                    left: "2px",
                    right: "2px",
                    height: "3px",
                    borderRadius: "999px",
                    background: "linear-gradient(90deg, #3b82f6, #93c5fd)",
                    opacity: 0.75,
                  }}
                />
              </span>{" "}
              Communities
            </h1>

            {/* Subtitle */}
            <p
              className="text-center mb-10 sm:mb-11"
              style={{
                fontSize: "clamp(15px, 1.8vw, 17.5px)",
                color: "rgba(255,255,255,0.68)",
                lineHeight: 1.8,
                maxWidth: "480px",
              }}
            >
              Connecting people in crisis with volunteers, donors, and first
              responders — quickly and transparently, even without internet.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-14 sm:mb-16">
              <a
                href="#requests"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("requests")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14.5px",
                  padding: "14px 34px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 24px rgba(24,95,165,0.52), inset 0 1px 0 rgba(255,255,255,0.16)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 8px 36px rgba(24,95,165,0.62), inset 0 1px 0 rgba(255,255,255,0.16)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 4px 24px rgba(24,95,165,0.52), inset 0 1px 0 rgba(255,255,255,0.16)";
                }}
              >
                <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Active Requests
              </a>

              {isCommunityMember && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: "rgba(255,255,255,0.09)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "14.5px",
                    padding: "14px 34px",
                    borderRadius: "999px",
                    border: "1.5px solid rgba(255,255,255,0.28)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
                  }}
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Request
                </button>
              )}

              {!isSignedIn && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: "rgba(255,255,255,0.09)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "14.5px",
                    padding: "14px 34px",
                    borderRadius: "999px",
                    border: "1.5px solid rgba(255,255,255,0.28)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.09)";
                  }}
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Community
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* ── Wave transition to next section ── */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
          style={{ height: "110px" }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 110"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <path
              d="M0,55 C240,110 480,0 720,55 C960,110 1200,10 1440,55 L1440,110 L0,110 Z"
              fill="rgba(248,249,251,0.12)"
            />
            <path
              d="M0,70 C360,110 1080,22 1440,70 L1440,110 L0,110 Z"
              fill="rgba(248,249,251,0.35)"
            />
            <path
              d="M0,88 C480,110 960,58 1440,88 L1440,110 L0,110 Z"
              fill="#F8F9FB"
            />
          </svg>
        </div>
      </section>

      {/* ── Mission / About ─────────────────────────────────────────────────── */}
      <section id="about" className="relative bg-white py-20 lg:py-28 overflow-hidden">

        {/* Decorative background orb */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-80px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(219,234,254,0.45) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">

            {/* ── Left: copy ── */}
            <div>
              {/* Eyebrow badge */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                }}
              >
                <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                  Our Mission
                </span>
              </div>

              {/* Heading */}
              <h2
                className="font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6"
                style={{ fontSize: "clamp(28px, 3.8vw, 44px)" }}
              >
                Bridging the gap between{" "}
                <span
                  style={{
                    color: "#185FA5",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  need and response
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: 0,
                      right: 0,
                      height: "2.5px",
                      borderRadius: "999px",
                      background: "linear-gradient(90deg, #185FA5, #60a5fa)",
                      opacity: 0.4,
                    }}
                  />
                </span>
              </h2>

              {/* Pull quote */}
              <div
                className="mb-5 pl-4"
                style={{ borderLeft: "3px solid #185FA5" }}
              >
                <p
                  className="text-slate-700 leading-relaxed font-medium"
                  style={{ fontSize: "clamp(15px, 1.5vw, 16.5px)" }}
                >
                  CommunityAid connects people facing emergencies with volunteers,
                  donors, and responders — even in areas with limited internet access.
                </p>
              </div>

              <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
                Whether it's a medical crisis, a family in need of food, a rescue
                situation, or a shelter emergency — we make sure help finds its way
                to those who need it most, quickly and transparently.
              </p>

              {/* Mission pillars */}
              <ul className="space-y-3 mb-9">
                {[
                  {
                    title: "Always Reachable",
                    text: "Works offline so requests reach helpers even with poor connectivity.",
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                      </svg>
                    ),
                  },
                  {
                    title: "Verified & Transparent",
                    text: "Every request is reviewed by an admin before going live.",
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Community-Driven",
                    text: "Built for and with Ugandan communities to reflect real challenges.",
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                  },
                ].map((pillar) => (
                  <li key={pillar.title} className="flex items-start gap-3">
                    <span
                      className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 mt-0.5"
                      style={{ background: "#EFF6FF", color: "#185FA5" }}
                    >
                      {pillar.icon}
                    </span>
                    <p className="text-[14px] text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800">{pillar.title}</span>
                      {" — "}
                      {pillar.text}
                    </p>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {!isSignedIn && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-[13.5px] font-semibold px-5 py-2.5 rounded-full text-white transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                    boxShadow: "0 2px 14px rgba(24,95,165,0.32)",
                  }}
                >
                  Join the community
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>

            {/* ── Right: stat cards ── */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: "1,200+",
                  label: "Requests Handled",
                  desc: "Since platform launch",
                  color: "#185FA5",
                  bg: "#EFF6FF",
                  border: "#BFDBFE",
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  ),
                },
                {
                  value: "340+",
                  label: "Active Volunteers",
                  desc: "Across all districts",
                  color: "#059669",
                  bg: "#ECFDF5",
                  border: "#A7F3D0",
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  value: "28",
                  label: "Districts Covered",
                  desc: "Across Uganda",
                  color: "#D97706",
                  bg: "#FFFBEB",
                  border: "#FDE68A",
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  value: "UGX 45M+",
                  label: "Aid Mobilised",
                  desc: "Directly to communities",
                  color: "#185FA5",
                  bg: "#EFF6FF",
                  border: "#BFDBFE",
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: stat.bg,
                    border: `1px solid ${stat.border}`,
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-1 w-full" style={{ background: stat.color }} />

                  <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1">
                    {/* Icon */}
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.8)", color: stat.color }}
                    >
                      {stat.icon}
                    </div>

                    {/* Value */}
                    <div>
                      <span
                        className="font-extrabold leading-none block"
                        style={{
                          fontSize: "clamp(22px, 2.8vw, 30px)",
                          color: stat.color,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {stat.value}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 mt-1 block">
                        {stat.label}
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        {stat.desc}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative bg-[#F8F9FB] py-20 lg:py-28 overflow-hidden">

        {/* Decorative background dots grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Section header ── */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
            >
              <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                Simple Process
              </span>
            </div>

            <h2
              className="font-extrabold text-slate-900 tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(26px, 3.8vw, 42px)" }}
            >
              From crisis to help —{" "}
              <span style={{ color: "#185FA5" }}>in four steps</span>
            </h2>
            <p className="text-slate-500 leading-relaxed" style={{ fontSize: "clamp(14px, 1.4vw, 16px)" }}>
              Our platform keeps every step fast, transparent, and accessible
              — even in areas with limited connectivity.
            </p>
          </div>

          {/* ── Progress track (desktop) ── */}
          <div className="hidden lg:flex items-center justify-center mb-10 px-16">
            {["01", "02", "03", "04"].map((n, i) => (
              <div key={n} className="flex items-center flex-1">
                <div
                  className="flex items-center justify-center h-10 w-10 rounded-full font-black text-sm text-white shrink-0 shadow-md"
                  style={{
                    background: ["#185FA5","#D97706","#059669","#185FA5"][i],
                    boxShadow: `0 0 0 4px white, 0 0 0 6px ${["#BFDBFE","#FDE68A","#A7F3D0","#BFDBFE"][i]}`,
                    fontSize: "13px",
                  }}
                >
                  {n}
                </div>
                {i < 3 && (
                  <div className="flex-1 flex items-center mx-2" aria-hidden="true">
                    <div
                      className="flex-1 h-[2px]"
                      style={{
                        background: `linear-gradient(90deg, ${["#185FA5","#D97706","#059669"][i]}, ${["#D97706","#059669","#185FA5"][i]})`,
                        opacity: 0.25,
                      }}
                    />
                    <svg
                      className="h-4 w-4 shrink-0 -ml-1"
                      style={{ color: ["#D97706","#059669","#185FA5"][i], opacity: 0.5 }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Step cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                title: "Post a Request",
                description:
                  "A community member describes their emergency, picks a category, and shares their location.",
                color: "#185FA5",
                bg: "#EFF6FF",
                border: "#BFDBFE",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Admin Reviews",
                description:
                  "A CommunityAid admin verifies the request for authenticity before opening it to responders.",
                color: "#D97706",
                bg: "#FFFBEB",
                border: "#FDE68A",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Helpers Respond",
                description:
                  "Volunteers and donors browse approved requests and offer transport, supplies, or financial support.",
                color: "#059669",
                bg: "#ECFDF5",
                border: "#A7F3D0",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                step: "04",
                title: "Help Is Delivered",
                description:
                  "Aid is coordinated and tracked through the platform until the request is resolved and closed.",
                color: "#185FA5",
                bg: "#EFF6FF",
                border: "#BFDBFE",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ border: `1px solid ${item.border}` }}
              >
                {/* Coloured top bar */}
                <div className="h-1 w-full" style={{ background: item.color }} />

                <div className="p-6 flex flex-col gap-4 flex-1">
                  {/* Icon + watermark number row */}
                  <div className="flex items-start justify-between">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: item.bg, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span
                      className="font-black leading-none select-none"
                      style={{
                        fontSize: "52px",
                        color: item.color,
                        opacity: 0.08,
                        letterSpacing: "-3px",
                        lineHeight: 1,
                      }}
                    >
                      {item.step}
                    </span>
                  </div>

                  {/* Step pill */}
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ background: item.color, fontSize: "10px", fontWeight: 800 }}
                    >
                      {parseInt(item.step)}
                    </div>
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-widest"
                      style={{ color: item.color }}
                    >
                      Step {item.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <h3
                      className="font-extrabold text-slate-900"
                      style={{ fontSize: "15px", letterSpacing: "-0.2px" }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[13.5px] text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bottom note ── */}
          <p className="text-center text-sm text-slate-400 mt-10 flex items-center justify-center gap-2">
            <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Every request is verified before helpers are notified — keeping aid genuine and trustworthy.
          </p>

        </div>
      </section>

      {/* ── Aid Categories ──────────────────────────────────────────────────── */}
      <section
        id="aid-types"
        className="relative py-20 lg:py-28 overflow-hidden"
        style={{ background: "#F8F9FB" }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.14) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
          aria-hidden="true"
        />
        {/* Top radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-160px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(219,234,254,0.55) 0%, transparent 68%)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Section header ── */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
            >
              <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                What We Cover
              </span>
            </div>

            <h2
              className="font-extrabold text-slate-900 tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(26px, 3.8vw, 42px)" }}
            >
              Four types of{" "}
              <span style={{ color: "#185FA5" }}>emergency aid</span>
            </h2>
            <p className="text-slate-500 leading-relaxed" style={{ fontSize: "clamp(14px, 1.4vw, 16px)" }}>
              Every request is categorised so the right helpers find it
              instantly and can respond with speed and confidence.
            </p>
          </div>

          {/* ── Category cards — 2×2 grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                label: "Medical",
                urgencyLabel: "Critical",
                shortDesc: "Healthcare & clinical support",
                description:
                  "Covers urgent healthcare needs including medications, hospital transport, first aid, and critical care for community members who cannot afford or access care alone.",
                headerGradient: "linear-gradient(135deg, #185FA5 0%, #1e3a8a 100%)",
                accentColor: "#185FA5",
                borderColor: "#BFDBFE",
                tagBg: "#EFF6FF",
                tagColor: "#1d4ed8",
                tagBorder: "#BFDBFE",
                tags: ["Hospital Transport", "Medication", "First Aid", "Critical Care"],
                watermarkIcon: (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "100%", height: "100%" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                icon: (
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
              {
                label: "Food",
                urgencyLabel: "Urgent",
                shortDesc: "Nutrition & food insecurity",
                description:
                  "Addresses acute food insecurity — emergency meals, dry food supplies, and targeted feeding programmes for families, children, and the elderly in crisis situations.",
                headerGradient: "linear-gradient(135deg, #D97706 0%, #92400e 100%)",
                accentColor: "#D97706",
                borderColor: "#FDE68A",
                tagBg: "#FFFBEB",
                tagColor: "#92400e",
                tagBorder: "#FDE68A",
                tags: ["Emergency Meals", "Food Supplies", "Nutrition", "Feeding Programs"],
                watermarkIcon: (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "100%", height: "100%" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                icon: (
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                label: "Rescue",
                urgencyLabel: "Emergency",
                shortDesc: "Life-threatening situations",
                description:
                  "For life-threatening events requiring immediate on-the-ground response — flooding, road accidents, fire incidents, or sudden displacement from homes.",
                headerGradient: "linear-gradient(135deg, #DC2626 0%, #991b1b 100%)",
                accentColor: "#DC2626",
                borderColor: "#FECACA",
                tagBg: "#FEF2F2",
                tagColor: "#991b1b",
                tagBorder: "#FECACA",
                tags: ["Flooding", "Accidents", "Fire Response", "Displacement"],
                watermarkIcon: (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "100%", height: "100%" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
                icon: (
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
              },
              {
                label: "Shelter",
                urgencyLabel: "Priority",
                shortDesc: "Housing & accommodation",
                description:
                  "Supports safe and dignified housing — temporary accommodation, structural repairs, roofing assistance, and construction support for families displaced or in need.",
                headerGradient: "linear-gradient(135deg, #059669 0%, #065f46 100%)",
                accentColor: "#059669",
                borderColor: "#A7F3D0",
                tagBg: "#ECFDF5",
                tagColor: "#065f46",
                tagBorder: "#A7F3D0",
                tags: ["Accommodation", "Construction", "Roofing", "Displaced Families"],
                watermarkIcon: (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "100%", height: "100%" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                icon: (
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
            ].map((cat) => (
              <div
                key={cat.label}
                className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                style={{
                  border: `1px solid ${cat.borderColor}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                {/* ── Coloured header band ── */}
                <div
                  className="relative flex items-center gap-5 px-7 py-6 overflow-hidden"
                  style={{ background: cat.headerGradient, minHeight: "100px" }}
                >
                  {/* Watermark icon — far right */}
                  <div
                    className="absolute -right-4 -top-4 bottom-0 flex items-center pointer-events-none"
                    style={{ width: "130px", color: "white", opacity: 0.1 }}
                    aria-hidden="true"
                  >
                    {cat.watermarkIcon}
                  </div>

                  {/* Top shimmer */}
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                    aria-hidden="true"
                  />

                  {/* Icon tile */}
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.28)",
                    }}
                  >
                    {cat.icon}
                  </div>

                  {/* Label + urgency badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h3
                        className="font-extrabold text-white leading-tight"
                        style={{ fontSize: "clamp(17px, 2vw, 21px)", letterSpacing: "-0.3px" }}
                      >
                        {cat.label}
                      </h3>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          color: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(255,255,255,0.28)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        {cat.urgencyLabel}
                      </span>
                    </div>
                    <p className="text-[12.5px] font-medium truncate" style={{ color: "rgba(255,255,255,0.72)" }}>
                      {cat.shortDesc}
                    </p>
                  </div>
                </div>

                {/* ── Card body ── */}
                <div className="p-7 flex flex-col gap-5 flex-1">

                  {/* Description */}
                  <p className="text-[14px] text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Sub-category tags */}
                  <div>
                    <p
                      className="text-[10.5px] font-bold uppercase tracking-widest mb-2.5"
                      style={{ color: cat.accentColor, opacity: 0.7 }}
                    >
                      Includes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[12px] font-semibold px-3 py-1 rounded-full"
                          style={{
                            background: cat.tagBg,
                            color: cat.tagColor,
                            border: `1px solid ${cat.tagBorder}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-5 border-t border-gray-100">
                    <a
                      href="#requests"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("requests")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 text-[13px] font-bold transition-all duration-200 group-hover:gap-3"
                      style={{ color: cat.accentColor }}
                    >
                      <span>See {cat.label} requests</span>
                      <svg
                        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* ── Bottom info strip ── */}
          <div className="mt-12 flex justify-center">
            <div
              className="inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
            >
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[13px] text-blue-800 font-medium">
                Not sure which category fits?{" "}
                <span className="font-bold">Post your request</span> and our admin team will help classify it.
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Requests ───────────────────────────────────────────────────────── */}
      <section id="requests" className="bg-[#F8F9FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Live Feed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Emergency Requests
              </h2>
              <p className="text-[14px] text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                Active requests from communities across Uganda
                {!isLoading_ && requests.length > 0 && (
                  <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
                    {requests.length} active
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Donation call-to-action hint */}
              <div
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-medium"
                style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065f46" }}
              >
                <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Click <strong className="mx-0.5">Donate Now</strong> on any card to help directly
              </div>
              {isCommunityMember && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-200/60 hover:shadow-lg active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Request
                </button>
              )}
            </div>
          </div>

          {isCached && (
            <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Showing cached data. Connect to the internet to see the latest requests.
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    typeFilter === t
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/60 shadow-sm"
                  }`}
                >
                  {t === "" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}

              {isAdmin && (
                <>
                  <div className="hidden sm:block w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.filter(Boolean).map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {hasActiveFilters && (
                <button
                  onClick={() => { setTypeFilter(""); setStatusFilter(""); setLocationFilter(""); }}
                  className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Search by location…"
              className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {isLoading_ ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <RequestCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-red-50 mb-4">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-slate-800 font-semibold text-base">Failed to load requests</p>
              <p className="text-slate-400 text-sm mt-1">Please check your connection and try again.</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mb-4">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-800 font-semibold text-base">No requests found</p>
              <p className="text-slate-400 text-sm mt-1">
                {hasActiveFilters
                  ? "Try clearing the filters to see more results."
                  : "There are no active emergency requests right now."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setTypeFilter(""); setStatusFilter(""); setLocationFilter(""); }}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ── Ways to Get Involved ─────────────────────────────────────────────── */}
      <section
        id="get-involved"
        className="relative py-20 lg:py-28 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #060d1f 0%, #0a1c44 55%, #060d1f 100%)" }}
      >
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)",
          }}
          aria-hidden="true"
        />

        {/* Left glow orb */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "5%",
            left: "-8%",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(24,95,165,0.28) 0%, transparent 68%)",
            filter: "blur(70px)",
          }}
          aria-hidden="true"
        />

        {/* Right glow orb */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "0%",
            right: "-6%",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(5,150,105,0.20) 0%, transparent 68%)",
            filter: "blur(70px)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Section header — left-aligned ── */}
          <div className="mb-14 max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-12 shrink-0" style={{ background: "rgba(96,165,250,0.4)" }} />
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "#60a5fa" }}
              >
                Take Action
              </span>
            </div>
            <h2
              className="font-extrabold text-white leading-tight mb-4"
              style={{ fontSize: "clamp(26px, 3.8vw, 44px)", letterSpacing: "-0.5px" }}
            >
              How You Can{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Make an Impact
              </span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: 1.75 }}>
              Whether you're facing a crisis, a skilled helper, or someone who wants to give — every action moves communities forward.
            </p>
          </div>

          {/* ── Asymmetric card grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">

            {/* ── Card 1: Post a Request — tall featured card ── */}
            <div
              className="group lg:col-span-2 relative rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_24px_60px_rgba(0,0,0,0.45)]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(96,165,250,0.2)",
              }}
            >
              {/* Blue gradient top accent */}
              <div
                className="h-[3px] w-full shrink-0"
                style={{ background: "linear-gradient(90deg, #185FA5, #60a5fa, #93c5fd)" }}
              />

              {/* Watermark step number */}
              <div
                className="absolute top-3 right-4 font-black select-none pointer-events-none leading-none"
                style={{
                  fontSize: "108px",
                  color: "rgba(96,165,250,0.055)",
                  letterSpacing: "-6px",
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                01
              </div>

              <div className="relative z-10 p-7 sm:p-8 flex flex-col flex-1 gap-6">

                {/* Audience chip */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit text-[11px] font-bold"
                  style={{
                    background: "rgba(96,165,250,0.10)",
                    color: "#93c5fd",
                    border: "1px solid rgba(96,165,250,0.22)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  For Community Members
                </div>

                {/* Icon */}
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(96,165,250,0.10)",
                    border: "1px solid rgba(96,165,250,0.22)",
                    color: "#60a5fa",
                  }}
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>

                {/* Content */}
                <div>
                  <h3
                    className="font-extrabold text-white mb-3 leading-tight"
                    style={{ fontSize: "clamp(20px, 2.2vw, 25px)", letterSpacing: "-0.4px" }}
                  >
                    Post a Request
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.75 }}>
                    Facing an emergency? Describe your situation, pick a category, and share your location. Our verified network of volunteers, donors, and responders will mobilise — even without internet.
                  </p>
                </div>

                {/* Feature checklist */}
                <ul className="space-y-2.5">
                  {[
                    "Free to post — no account needed",
                    "Admin reviews every request before it goes live",
                    "Works offline so help still reaches you",
                  ].map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-[13.5px]"
                      style={{ color: "rgba(255,255,255,0.52)" }}
                    >
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(96,165,250,0.14)", color: "#60a5fa" }}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

                {/* CTA — adapts to auth state */}
                <div className="mt-auto">
                  {!isSignedIn ? (
                    <Link
                      to="/register"
                      className="flex items-center justify-center gap-2.5 text-[14px] font-bold text-white rounded-2xl px-5 py-3.5 transition-all duration-200 hover:gap-4"
                      style={{
                        background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                        boxShadow: "0 4px 20px rgba(37,99,235,0.38)",
                      }}
                    >
                      Get Started — It's Free
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  ) : isCommunityMember ? (
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full flex items-center justify-center gap-2.5 text-[14px] font-bold text-white rounded-2xl px-5 py-3.5 transition-all duration-200 hover:gap-4 active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                        boxShadow: "0 4px 20px rgba(37,99,235,0.38)",
                      }}
                    >
                      Post a Request Now
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  ) : (
                    <a
                      href="#requests"
                      onClick={(e) => { e.preventDefault(); document.getElementById("requests")?.scrollIntoView({ behavior: "smooth" }); }}
                      className="flex items-center justify-center gap-2.5 text-[14px] font-bold text-white rounded-2xl px-5 py-3.5 transition-all duration-200 hover:gap-4"
                      style={{
                        background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                        boxShadow: "0 4px 20px rgba(37,99,235,0.38)",
                      }}
                    >
                      View All Requests
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>

              </div>
            </div>

            {/* ── Right column: Volunteer + Donate stacked ── */}
            <div className="lg:col-span-3 flex flex-col gap-5">

              {/* ── Card 2: Volunteer & Offer Help ── */}
              <a
                href="#requests"
                onClick={(e) => { e.preventDefault(); document.getElementById("requests")?.scrollIntoView({ behavior: "smooth" }); }}
                className="group relative rounded-3xl overflow-hidden flex flex-col sm:flex-row flex-1 transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(74,222,128,0.35),0_16px_48px_rgba(0,0,0,0.40)] cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  textDecoration: "none",
                }}
              >
                {/* Gradient accent bar — top on mobile, left on sm+ */}
                <div
                  className="h-[3px] sm:h-auto sm:w-[3px] w-full shrink-0 rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none"
                  style={{ background: "linear-gradient(180deg, #4ade80, #059669)" }}
                />

                {/* Watermark */}
                <div
                  className="absolute top-3 right-5 font-black select-none pointer-events-none leading-none"
                  style={{ fontSize: "80px", color: "rgba(74,222,128,0.06)", letterSpacing: "-4px", lineHeight: 1 }}
                  aria-hidden="true"
                >
                  02
                </div>

                {/* Icon panel */}
                <div className="flex sm:flex-col items-center justify-center p-6 sm:p-7 sm:pr-4">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(74,222,128,0.10)",
                      border: "1px solid rgba(74,222,128,0.22)",
                      color: "#4ade80",
                    }}
                  >
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col flex-1 gap-3 p-6 pt-0 sm:pt-6 sm:pl-2">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-[10.5px] font-bold"
                    style={{
                      background: "rgba(74,222,128,0.10)",
                      color: "#4ade80",
                      border: "1px solid rgba(74,222,128,0.2)",
                    }}
                  >
                    For Volunteers
                  </div>
                  <div>
                    <h3
                      className="font-extrabold text-white mb-1.5 leading-tight"
                      style={{ fontSize: "clamp(17px, 1.8vw, 21px)", letterSpacing: "-0.3px" }}
                    >
                      Volunteer &amp; Offer Help
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.48)", fontSize: "13.5px", lineHeight: 1.7 }}>
                      Browse active requests near you and offer transport, professional expertise, or on-the-ground assistance — no donation required.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.07]">
                    <span
                      className="inline-flex items-center gap-2 text-[12.5px] font-bold transition-all duration-200 group-hover:gap-3"
                      style={{ color: "#4ade80" }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Browse Requests
                    </span>
                    <span
                      className="text-[11px] font-semibold px-3 py-1 rounded-full"
                      style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.18)" }}
                    >
                      340+ volunteers active
                    </span>
                  </div>
                </div>
              </a>

              {/* ── Card 3: Donate to a Cause ── */}
              <a
                href="#requests"
                onClick={(e) => { e.preventDefault(); document.getElementById("requests")?.scrollIntoView({ behavior: "smooth" }); }}
                className="group relative rounded-3xl overflow-hidden flex flex-col sm:flex-row flex-1 transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(249,168,212,0.35),0_16px_48px_rgba(0,0,0,0.40)] cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(249,168,212,0.2)",
                  textDecoration: "none",
                }}
              >
                {/* Gradient accent bar */}
                <div
                  className="h-[3px] sm:h-auto sm:w-[3px] w-full shrink-0 rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none"
                  style={{ background: "linear-gradient(180deg, #f9a8d4, #ec4899)" }}
                />

                {/* Watermark */}
                <div
                  className="absolute top-3 right-5 font-black select-none pointer-events-none leading-none"
                  style={{ fontSize: "80px", color: "rgba(249,168,212,0.06)", letterSpacing: "-4px", lineHeight: 1 }}
                  aria-hidden="true"
                >
                  03
                </div>

                {/* Icon panel */}
                <div className="flex sm:flex-col items-center justify-center p-6 sm:p-7 sm:pr-4">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(249,168,212,0.10)",
                      border: "1px solid rgba(249,168,212,0.22)",
                      color: "#f9a8d4",
                    }}
                  >
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col flex-1 gap-3 p-6 pt-0 sm:pt-6 sm:pl-2">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-[10.5px] font-bold"
                    style={{
                      background: "rgba(249,168,212,0.10)",
                      color: "#f9a8d4",
                      border: "1px solid rgba(249,168,212,0.2)",
                    }}
                  >
                    For Donors
                  </div>
                  <div>
                    <h3
                      className="font-extrabold text-white mb-1.5 leading-tight"
                      style={{ fontSize: "clamp(17px, 1.8vw, 21px)", letterSpacing: "-0.3px" }}
                    >
                      Donate to a Cause
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.48)", fontSize: "13.5px", lineHeight: 1.7 }}>
                      Give via mobile money or card. Your contribution reaches verified community members directly — tracked transparently until delivered.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.07]">
                    <span
                      className="inline-flex items-center gap-2 text-[12.5px] font-bold transition-all duration-200 group-hover:gap-3"
                      style={{ color: "#f9a8d4" }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Give Now
                    </span>
                    <span
                      className="text-[11px] font-semibold px-3 py-1 rounded-full"
                      style={{ background: "rgba(249,168,212,0.10)", color: "#f9a8d4", border: "1px solid rgba(249,168,212,0.18)" }}
                    >
                      UGX 45M+ raised
                    </span>
                  </div>
                </div>
              </a>

            </div>
          </div>

          {/* ── Trust bar ── */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                text: "No account needed to donate or volunteer",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              },
              {
                text: "Every request admin-verified before helpers are notified",
                icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
              },
              {
                text: "Works offline — help reaches even remote communities",
                icon: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <svg
                  className="h-4 w-4 shrink-0 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-[12.5px] leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="bg-[#F8F9FB] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
              Community Stories
            </p>
            <h2
              className="font-extrabold text-slate-900 tracking-tight leading-tight mb-3"
              style={{ fontSize: "clamp(24px, 3.5vw, 38px)" }}
            >
              Real Impact, Real People
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Hear from the people whose lives have been touched by CommunityAid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "My daughter needed urgent medical transport at 2am and I had no way to reach anyone. Within an hour of posting on CommunityAid, a volunteer was at our door. I don't know what we would have done without this platform.",
                name: "Aisha Nakamya",
                role: "Community Member, Kampala",
                initials: "AN",
                color: "#185FA5",
                bg: "#EFF6FF",
              },
              {
                quote:
                  "I've been volunteering on CommunityAid for six months. The platform makes it easy to find requests near me and actually show up for people. It's the most meaningful thing I do with my weekends.",
                name: "David Ochieng",
                role: "Volunteer Responder, Gulu",
                initials: "DO",
                color: "#059669",
                bg: "#ECFDF5",
              },
              {
                quote:
                  "We donated to three shelter requests after the floods in our district. The transparency on the platform — being able to see exactly how our money was used — made us confident to give more.",
                name: "Grace Tumusiime",
                role: "Donor, Mbarara",
                initials: "GT",
                color: "#7C3AED",
                bg: "#F5F3FF",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col gap-5"
              >
                {/* Quote mark */}
                <svg
                  className="h-8 w-8 shrink-0"
                  style={{ color: t.color, opacity: 0.25 }}
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>

                <p className="text-sm text-slate-600 leading-relaxed flex-1 italic">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CreateRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          setShowModal(false);
        }}
      />
    </div>
  );
};

export default HomePage;
