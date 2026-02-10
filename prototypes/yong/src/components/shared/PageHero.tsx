import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../Navigation';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  height?: '50vh' | '55vh' | '60vh' | '70vh' | '85vh' | '100vh';
  minHeight?: string;
  breadcrumbs?: Breadcrumb[];
  badge?: string;
  badgeIcon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  gradient?: string;
  parallaxSpeed?: number;
  titleBreak?: boolean;
}

const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  image,
  height = '70vh',
  minHeight,
  breadcrumbs,
  badge,
  badgeIcon,
  actions,
  children,
  gradient = 'bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/30 to-transparent',
  parallaxSpeed = 0.2,
  titleBreak = true,
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const words = title.split(' ');
  const hasMultipleWords = words.length > 1 && titleBreak;

  return (
    <>
      <Navigation variant="transparent" />
      <section
        className={`relative z-20 w-full flex items-end`}
        style={{ height, minHeight }}
      >
        {/* Background wrapper — clips parallax but not content */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 w-full h-[120%]"
            style={{ transform: `translateY(${scrollY * parallaxSpeed}px)` }}
          >
            <img
              src={image}
              className="w-full h-full object-cover"
              alt={title}
            />
          </div>
          <div className={`absolute inset-0 ${gradient}`} />
        </div>

        {/* Content — sits outside the overflow-hidden wrapper */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="text-white">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-white/20">/</span>}
                      {crumb.href ? (
                        <Link to={crumb.href} className="text-white/40 hover:text-white transition-colors">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-[#Bfa67a]">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}

              {/* Badge / Category Label */}
              {badge && (
                <span className="flex items-center gap-2 text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">
                  {badgeIcon}
                  {badge}
                </span>
              )}

              {/* Title */}
              <h1 className="text-6xl md:text-8xl font-serif leading-[0.9] tracking-tight mb-6">
                {hasMultipleWords ? (
                  words.map((word, i) => (
                    i === words.length - 1
                      ? <span key={i}><br/><span className="italic font-light">{word}</span></span>
                      : <span key={i}>{word} </span>
                  ))
                ) : (
                  title
                )}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="text-xl text-white/70 font-light italic max-w-lg">{subtitle}</p>
              )}
            </div>

            {/* Actions (buttons, play button, etc.) */}
            {actions && (
              <div className="hidden lg:flex flex-col sm:flex-row gap-3">
                {actions}
              </div>
            )}
          </div>

          {/* Children (search bars, etc.) */}
          {children}
        </div>
      </section>
    </>
  );
};

export default PageHero;
