import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { getCommunityById } from './data/communities';

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

// Insights placeholder (templates + components TBD)
const InsightsPlaceholder = lazy(() => import('./pages/InsightsPlaceholder'));

// Temp analytics sandbox
const TempAnalytics = lazy(() => import('./pages/TempAnalytics'));

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
    return <Navigate to={`/phoenix/${community.region}/${community.id}`} replace />;
  }
  return <Navigate to="/communities" replace />;
};

// Market report → insights param-preserving redirects
const MarketReportRedirect = () => <Navigate to="/insights" replace />;

const MarketReportRegionRedirect = () => {
  const { region } = useParams();
  return <Navigate to={`/insights/${region}`} replace />;
};

const MarketReportZipcodeRedirect = () => {
  const { region, zipcode } = useParams();
  return <Navigate to={`/insights/${region}/${zipcode}`} replace />;
};

const MarketReportCommunityRedirect = () => {
  const { region, zipcode, community } = useParams();
  return <Navigate to={`/insights/${region}/${zipcode}/${community}`} replace />;
};

// Minimal loading state that doesn't flash
const PageLoader = () => (
  <div className="min-h-screen bg-[#F9F8F6]" />
);

function App() {
  return (
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

          {/* Temp analytics sandbox — all scope levels */}
          <Route path="/temp/analytics" element={<TempAnalytics />} />
          <Route path="/temp/analytics/:region" element={<TempAnalytics />} />
          <Route path="/temp/analytics/:region/:zipcode" element={<TempAnalytics />} />
          <Route path="/temp/analytics/:region/:zipcode/:community" element={<TempAnalytics />} />

          {/* Unified Insights Dashboard — all scope levels */}
          <Route path="/insights" element={<InsightsPlaceholder />} />
          <Route path="/insights/buyers" element={<BuyersCenter />} />
          <Route path="/insights/sellers" element={<SellersCenter />} />
          <Route path="/insights/:region" element={<InsightsPlaceholder />} />
          <Route path="/insights/:region/:zipcode" element={<InsightsPlaceholder />} />
          <Route path="/insights/:region/:zipcode/:community" element={<InsightsPlaceholder />} />

          {/* Legacy redirects: /market-report/* → /insights/* */}
          <Route path="/report" element={<Navigate to="/insights" replace />} />
          <Route path="/market-report" element={<MarketReportRedirect />} />
          <Route path="/market-report/:region" element={<MarketReportRegionRedirect />} />
          <Route path="/market-report/:region/:zipcode" element={<MarketReportZipcodeRedirect />} />
          <Route path="/market-report/:region/:zipcode/:community" element={<MarketReportCommunityRedirect />} />

          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
