import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import NeighborhoodProfile from './pages/NeighborhoodProfile';
import NeighborhoodProfile2 from './pages/NeighborhoodProfile2';
import InteractiveMap from './pages/InteractiveMap';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Communities from './pages/Communities';
import CommunityPage from './pages/CommunityPage';
import RegionPage from './pages/RegionPage';
import InsightsDashboard from './pages/InsightsDashboard';
import BuyersCenter from './pages/BuyersCenter';
import SellersCenter from './pages/SellersCenter';

// Market Report Pages (drill-down system)
import MarketOverviewPage from './pages/market-report/MarketOverviewPage';
import RegionReportPage from './pages/market-report/RegionReportPage';
import ZipcodeReportPage from './pages/market-report/ZipcodeReportPage';
import CommunityReportPage from './pages/market-report/CommunityReportPage';

// Initialize the market data registry
import './models';

function App() {
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/neighborhood" element={<NeighborhoodProfile />} />
        <Route path="/neighborhood2" element={<NeighborhoodProfile2 />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/community/:id" element={<CommunityPage />} />
        <Route path="/:region/:community" element={<CommunityPage />} />
        <Route path="/region/:regionId" element={<RegionPage />} />
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
      </Routes>
    </div>
  );
}

export default App;
