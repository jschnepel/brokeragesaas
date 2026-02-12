import type { MarketScope } from '../../models/MarketScope';
import DrilldownCard from '../../components/market-report/DrilldownCard';

interface PageShellScopeNavProps {
  scope: MarketScope;
  basePath: string;
}

function rewriteUrl(url: string, basePath: string): string {
  if (url === '/insights') return `/${basePath}`;
  if (url.startsWith('/insights/')) return url.replace('/insights/', `/${basePath}/`);
  return url;
}

const PageShellScopeNav: React.FC<PageShellScopeNavProps> = ({ scope, basePath }) => {
  const children = scope.getChildren();
  if (children.length === 0) return null;

  const childLabel =
    scope.level === 'market' ? 'Regions' :
    scope.level === 'region' ? 'Zip Codes' :
    'Communities';

  return (
    <section className="bg-[#F9F8F6] py-6 print:hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
            Explore {childLabel}
          </span>
          <span className="text-[8px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700">
            IDX
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {children.map((child, i) => {
            const kpis = child.getKpis();
            return (
              <DrilldownCard
                key={child.slug}
                name={child.name}
                url={rewriteUrl(child.getUrl(), basePath)}
                image={child.image}
                subtitle={child.level === 'zipcode' ? `${child.slug}` : undefined}
                stats={kpis.slice(0, 4).map(k => ({ label: k.label, value: k.value }))}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PageShellScopeNav;
