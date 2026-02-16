import TemplateCommunityPage from './TemplateCommunityPage';
import { getCommunityById } from '../data/communities';
import { resolvedToTemplate } from '../utils/communityAdapter';

const TemplateCommunityDM = () => {
  const community = getCommunityById('desert-mountain');
  if (!community) return null;
  const data = resolvedToTemplate(community);
  return <TemplateCommunityPage data={data} />;
};

export default TemplateCommunityDM;
