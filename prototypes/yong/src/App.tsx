import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { getCommunityById } from './data/communities';
import { CompareProvider } from './context/CompareContext';
import CompareFloatingBar from './components/compare/CompareFloatingBar';
import CompareModal from './components/compare/CompareModal';

// Initialize the market data registry
import './models';

// HomePage loads eagerly (entry point)
import HomePage from './pages/HomePage';

// Everything else is lazy-loaded
const Communities = lazy(() => import('./pages/Communities'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const RegionPage = lazy(() => import('./pages/RegionPage'));
const InteractiveMap = lazy(() => import('./pages/InteractiveMap'));
const Listings = lazy(() => import('./pages/Listings'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BuyersCenter = lazy(() => import('./pages/BuyersCenter'));
const SellersCenter = lazy(() => import('./pages/SellersCenter'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Insights dashboard (restored from main)
const InsightsDashboard = lazy(() => import('./pages/InsightsDashboard'));

// Market report pages (restored from main)
const MarketOverviewPage = lazy(() => import('./pages/market-report/MarketOverviewPage'));
const RegionReportPage = lazy(() => import('./pages/market-report/RegionReportPage'));
const ZipcodeReportPage = lazy(() => import('./pages/market-report/ZipcodeReportPage'));
const CommunityReportPage = lazy(() => import('./pages/market-report/CommunityReportPage'));

// Temp analytics sandbox
const TempAnalytics = lazy(() => import('./pages/TempAnalytics'));

// Template community pages (JSON-driven)
const TemplateCommunityPage = lazy(() => import('./pages/TemplateCommunityPage'));
const TemplateCommunityDM = lazy(() => import('./pages/TemplateCommunityDM'));

// Scoped analytics pages
const MarketPulse = lazy(() => import('./pages/MarketPulse'));
const ComparativeAnalysis = lazy(() => import('./pages/ComparativeAnalysis'));
const TrendExplorer = lazy(() => import('./pages/TrendExplorer'));
const MarketSnapshot = lazy(() => import('./pages/MarketSnapshot'));

// --- Redirect helpers ---

const RegionRedirect = () => {
  const { regionId } = useParams();
  return <Navigate to={`/phoenix/${regionId}`} replace />;
};

const CommunityRedirect = () => {
  const { region, community } = useParams();
  return <Navigate to={`/phoenix/${region}/${community}`} replace />;
};

const CommunityIdRedirect = () => {
  const { id } = useParams();
  const community = id ? getCommunityById(id) : undefined;
  if (community) {
    return <Navigate to={`/phoenix/${community.identity.regionId}/${community.id}`} replace />;
  }
  return <Navigate to="/communities" replace />;
};


// Minimal loading state that doesn't flash
const PageLoader = () => (
  <div className="min-h-screen bg-[#F9F8F6]" />
);

function App() {
  return (
    <CompareProvider>
    <div className="min-h-screen bg-[#F9F8F6]">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/phoenix/:regionId/:communityId" element={<CommunityPage />} />
          <Route path="/phoenix/:regionId" element={<RegionPage />} />
          <Route path="/community/:id" element={<CommunityIdRedirect />} />
          <Route path="/:region/:community" element={<CommunityRedirect />} />
          <Route path="/region/:regionId" element={<RegionRedirect />} />
          <Route path="/map" element={<InteractiveMap />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listing" element={<ListingDetail />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/listings/:city/:zipcode/:address" element={<ListingDetail />} />
          <Route path="/listings/:city/:zipcode/:community/:address" element={<ListingDetail />} />

          {/* Template community pages — JSON-driven */}
          <Route path="/temp/community" element={<TemplateCommunityPage />} />
          <Route path="/temp/community_dm" element={<TemplateCommunityDM />} />

          {/* Temp analytics sandbox — all scope levels */}
          <Route path="/temp/analytics" element={<TempAnalytics />} />
          <Route path="/temp/analytics/:region" element={<TempAnalytics />} />
          <Route path="/temp/analytics/:region/:zipcode" element={<TempAnalytics />} />
          <Route path="/temp/analytics/:region/:zipcode/:community" element={<TempAnalytics />} />

          {/* Insights Dashboard */}
          <Route path="/insights" element={<InsightsDashboard />} />
          <Route path="/insights/buyers" element={<BuyersCenter />} />
          <Route path="/insights/sellers" element={<SellersCenter />} />

          {/* Market Pulse — activity feed */}
          <Route path="/pulse" element={<MarketPulse />} />
          <Route path="/pulse/:region" element={<MarketPulse />} />
          <Route path="/pulse/:region/:zipcode" element={<MarketPulse />} />
          <Route path="/pulse/:region/:zipcode/:community" element={<MarketPulse />} />

          {/* Comparative Analysis — side-by-side comparison */}
          <Route path="/compare" element={<ComparativeAnalysis />} />
          <Route path="/compare/:region" element={<ComparativeAnalysis />} />
          <Route path="/compare/:region/:zipcode" element={<ComparativeAnalysis />} />
          <Route path="/compare/:region/:zipcode/:community" element={<ComparativeAnalysis />} />

          {/* Trend Explorer — time-series deep dive */}
          <Route path="/trends" element={<TrendExplorer />} />
          <Route path="/trends/:region" element={<TrendExplorer />} />
          <Route path="/trends/:region/:zipcode" element={<TrendExplorer />} />
          <Route path="/trends/:region/:zipcode/:community" element={<TrendExplorer />} />

          {/* Market Snapshot — print/share summary */}
          <Route path="/snapshot" element={<MarketSnapshot />} />
          <Route path="/snapshot/:region" element={<MarketSnapshot />} />
          <Route path="/snapshot/:region/:zipcode" element={<MarketSnapshot />} />
          <Route path="/snapshot/:region/:zipcode/:community" element={<MarketSnapshot />} />

          {/* Market Report pages */}
          <Route path="/report" element={<Navigate to="/market-report" replace />} />
          <Route path="/market-report" element={<MarketOverviewPage />} />
          <Route path="/market-report/:region" element={<RegionReportPage />} />
          <Route path="/market-report/:region/:zipcode" element={<ZipcodeReportPage />} />
          <Route path="/market-report/:region/:zipcode/:community" element={<CommunityReportPage />} />

          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Suspense>
      <CompareFloatingBar />
      <CompareModal />
    </div>
    </CompareProvider>
  );
}

export default App;
