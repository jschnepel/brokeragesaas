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
const InsightsDashboard = lazy(() => import('./pages/InsightsDashboard'));
const BuyersCenter = lazy(() => import('./pages/BuyersCenter'));
const SellersCenter = lazy(() => import('./pages/SellersCenter'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const MarketOverviewPage = lazy(() => import('./pages/market-report/MarketOverviewPage'));
const RegionReportPage = lazy(() => import('./pages/market-report/RegionReportPage'));
const ZipcodeReportPage = lazy(() => import('./pages/market-report/ZipcodeReportPage'));
const CommunityReportPage = lazy(() => import('./pages/market-report/CommunityReportPage'));

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
          <Route path="/report" element={<Navigate to="/market-report" replace />} />
          <Route path="/market-report" element={<MarketOverviewPage />} />
          <Route path="/market-report/:region" element={<RegionReportPage />} />
          <Route path="/market-report/:region/:zipcode" element={<ZipcodeReportPage />} />
          <Route path="/market-report/:region/:zipcode/:community" element={<CommunityReportPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/insights" element={<InsightsDashboard />} />
          <Route path="/insights/buyers" element={<BuyersCenter />} />
          <Route path="/insights/sellers" element={<SellersCenter />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
