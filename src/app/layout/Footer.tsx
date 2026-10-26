import { ArrowUpRight, CheckCircle2, Globe, HeartHandshake, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { LogoMark } from './Logo'

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/**
 * Editorial Reference Footer:
 * Recreated from the reference design with social links, multi-column navigation,
 * compliance badges, marquee keywords, headquarters details, India surveillance map,
 * and massive dot-matrix watermark typography.
 */
export function Footer() {
  return (
    <footer className="mt-16 w-full rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] text-slate-800 dark:text-slate-200 shadow-[0_8px_32px_rgba(20,30,45,0.04)] overflow-hidden transition-colors print:hidden">
      {/* Top Multi-column Section */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-100 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Socials & Branding */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Socials
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-all"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="size-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex size-10 shrink-0 aspect-square items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-all"
                aria-label="Twitter / X"
              >
                <TwitterIcon className="size-3.5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex size-10 shrink-0 aspect-square items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-all"
                aria-label="GitHub"
              >
                <Globe className="size-4.5" />
              </a>
              <a
                href="mailto:surveillance@resilientepi.gov.in"
                className="flex size-10 shrink-0 aspect-square items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-all"
                aria-label="Email"
              >
                <Mail className="size-4.5" />
              </a>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <LogoMark className="size-6 text-blue-600" />
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                ResilientEpi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time dengue early warnings, spatial outbreak forecasts, and blind-spot detection for public health officers.
            </p>
          </div>

          {/* Navigation links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Platform
            </span>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to="/" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  National Risk Map
                </Link>
              </li>
              <li>
                <Link to="/blind-spots" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Blind-Spot Analysis
                </Link>
              </li>
              <li>
                <Link to="/actions" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Action Centre
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Reports & Bulletins
                </Link>
              </li>
            </ul>
          </div>

          {/* Research & Evidence */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Evidence Base
            </span>
            <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Outbreak Thresholds
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Climatic Covariates
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Lagged Rainfall Modeling
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Under-Reporting Signals
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Sero-Survey Integration
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutions */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Institutions
            </span>
            <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="hover:text-slate-900 dark:hover:text-white transition-colors">
                NVBDCP Surveillance
              </li>
              <li className="hover:text-slate-900 dark:hover:text-white transition-colors">
                ICMR Vector Biology
              </li>
              <li className="hover:text-slate-900 dark:hover:text-white transition-colors">
                IDSP Outbreak Alert
              </li>
              <li className="hover:text-slate-900 dark:hover:text-white transition-colors">
                NCDC Epidemiological Cell
              </li>
              <li className="hover:text-slate-900 dark:hover:text-white transition-colors">
                State Health Departments
              </li>
            </ul>
          </div>

          {/* Standards & Compliance */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Secure Protocols
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Epidemiological models conform to national surveillance data standards. Real-time predictive forecasts with strict privacy compliance.
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="size-3 text-emerald-500" /> ICMR Guidelines
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="size-3 text-blue-500" /> DPDP Act 2023
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Globe className="size-3 text-orange-500" /> FHIR / HL7
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <HeartHandshake className="size-3 text-emerald-500" /> Open Science
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Pill Tags & Editorial Marquee */}
      <div className="px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-2xs">
              National Surveillance
            </span>
            <span className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
              Outbreak Forecasting
            </span>
            <span className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
              Spatial Epidemiology
            </span>
          </div>

          <div className="overflow-hidden text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wide uppercase">
            <span className="inline-block">
              • Vector Control • Sero-Surveys • Climatic Forecasting • Rainfall Lag Models • Early Warning Protocols
            </span>
          </div>
        </div>
      </div>

      {/* Main Info Grid & Map Graphic */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-100 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
          {/* Aesthetic Monochrome Image Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-900 h-44 shadow-sm group">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px] opacity-25" />
            <div className="absolute inset-0 p-5 flex flex-col justify-between text-white z-10">
              <span className="text-[11px] font-bold tracking-widest text-blue-400 uppercase">
                Vector Laboratory
              </span>
              <div>
                <p className="text-base font-bold text-white tracking-tight leading-snug">
                  Precision Dengue Modeling Across India
                </p>
                <p className="text-xs text-slate-400 mt-1">780 District Spatial Horizons</p>
              </div>
            </div>
          </div>

          {/* Head Office */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Headquarters
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              National Vector Borne Disease Control Complex, 22 Sham Nath Marg, Civil Lines, Delhi 110054, India.
            </p>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1"
            >
              <span>Direction on Google Maps</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>

          {/* Contact & Hours */}
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                Surveillance Desk
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                surveillance@resilientepi.gov.in
              </p>
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                National Hotline
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                1800 112 345 (Toll Free)
              </p>
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                Operational Reach
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                28 States · 8 UTs · Automated 24/7 Model Monitoring
              </p>
            </div>
          </div>

          {/* Stylized Surveillance India Cluster Graphic */}
          <div className="relative flex items-center justify-center rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-5 h-44 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px] opacity-20" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-600 animate-ping" />
                <span className="size-2 rounded-full bg-orange-500" />
                <span className="size-2 rounded-full bg-emerald-500" />
              </div>
              <span className="mt-2 text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
                National Coverage Active
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-horizon Predictive Surveillance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer Legal Bar */}
      <div className="px-6 py-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-white">
        <div>
          <span>© 2026 ResilientEpi Platform. Crafted for Epidemiological Preparedness.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
          <Link to="/methodology" className="text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-blue-400 transition-colors">
            Data Governance
          </Link>
          <Link to="/methodology" className="text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-blue-400 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/methodology" className="text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-blue-400 transition-colors">
            Terms of Surveillance
          </Link>
          <Link to="/methodology" className="text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-blue-400 transition-colors">
            Open Access Data
          </Link>
          <span className="text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-blue-400 transition-colors cursor-pointer">
            Cookie Settings
          </span>
        </div>
      </div>

      {/* Massive Watermark Dot-Matrix Typography (Matching Reference "UNITED CARRIERS") */}
      <div className="relative w-full py-8 sm:py-12 px-4 flex items-center justify-center overflow-hidden select-none border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-black/40">
        <div
          className="text-center font-extrabold tracking-[0.18em] sm:tracking-[0.24em] text-4xl sm:text-6xl md:text-8xl lg:text-[110px] text-transparent leading-none uppercase"
          style={{
            WebkitTextStroke: '1.5px rgba(100, 116, 139, 0.22)',
            fontFamily: 'monospace, sans-serif',
          }}
        >
          RESILIENTEPI
        </div>
        {/* Floating Reticle Symbol Over Giant Typography */}
        <div className="absolute right-[22%] top-1/2 -translate-y-1/2 size-9 sm:size-12 shrink-0 aspect-square rounded-full border border-slate-400/50 dark:border-white/40 flex items-center justify-center shadow-xs">
          <span className="size-1.5 sm:size-2 shrink-0 aspect-square rounded-full bg-slate-800 dark:bg-white" />
        </div>
      </div>
    </footer>
  )
}
