import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const InsightsPlaceholder: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans page-zoom-85">
      <Navigation variant="solid" />

      <section className="pt-32 pb-24">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">
            Coming Soon
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-[#0C1C2E] mb-4">
            Market Insights
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
            Our unified market intelligence dashboard is being redesigned.
          </p>
          <Link
            to="/"
            className="inline-block bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all"
          >
            Back to Home
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InsightsPlaceholder;
