import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCommunityById } from '../data/communities';
import { resolvedToTemplate } from '../utils/communityAdapter';
import TemplateCommunityPage from './TemplateCommunityPage';
import PageHero from '../components/shared/PageHero';

const CommunityPage: React.FC = () => {
  const { communityId } = useParams<{ regionId?: string; communityId?: string }>();

  const community = communityId ? getCommunityById(communityId) : undefined;

  const templateData = useMemo(() => {
    if (!community) return undefined;
    return resolvedToTemplate(community);
  }, [community]);

  if (!community || !templateData) {
    return (
      <PageHero title="Community Not Found" image="" height="50vh">
        <div className="text-center mt-8">
          <p className="text-white/70 mb-8">The community you're looking for doesn't exist.</p>
          <Link
            to="/communities"
            className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
          >
            View All Communities
          </Link>
        </div>
      </PageHero>
    );
  }

  return <TemplateCommunityPage data={templateData} />;
};

export default CommunityPage;
