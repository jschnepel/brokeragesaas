import { Phone, Mail, FileText, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';

interface AgentContactSectionProps {
  communityCount?: number;
}

const AgentContactSection: React.FC<AgentContactSectionProps> = ({ communityCount }) => {
  const anim = useScrollAnimation();

  return (
    <section ref={anim.ref} className="pt-0 pb-0 bg-white border-t border-gray-200">
      <div className="max-w-[1600px] mx-auto px-8">
        <div
          className={`
            grid grid-cols-12 gap-8
            transition-all duration-1000
            ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
          `}
        >
          {/* Agent Image */}
          <div className="col-span-12 lg:col-span-4">
            <div className="aspect-[3/4] overflow-hidden bg-gray-100 shadow-lg shadow-black/5 relative">
              <img
                src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                className="w-full h-full object-cover"
                alt="Yong Choi"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-white p-4 flex items-center justify-center">
                <img
                  src="https://media.placester.com/image/upload/c_scale,dpr_1.0,f_auto,fl_lossy,q_auto/c_scale,w_3320/v1/inception-app-prod/MTU0NTVlNzktY2QyZC00ODFhLTkyNTQtYzAxNzY2ZGYyMGVk/content/2023/05/e8d40bc595dcf2e580a6dd7a0fde2a5e80f9327a.png"
                  alt="Russ Lyon Sotheby's International Realty"
                  className="h-12 object-contain brightness-0"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
            <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.4em] font-bold mb-4">Your Market Expert</span>
            <h3 className="text-2xl lg:text-3xl font-serif text-[#0C1C2E] mb-1">Yong Choi</h3>
            <p className="text-gray-400 text-sm mb-2">Realtor&reg; &bull; License #SA713323000</p>
            <p className="text-[#Bfa67a] text-xs mb-6">Russ Lyon Sotheby's International Realty</p>

            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              With over 32 years of experience in the mortgage industry and deep knowledge of North Scottsdale's luxury market,
              Yong provides unparalleled insight into market conditions, financing strategies, and investment opportunities.
              His understanding of mortgage underwriting guidelines is a crucial asset in navigating today's dynamic market.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <a href="tel:+19093765494" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors text-sm flex items-center gap-2">
                <Phone size={14} className="text-[#Bfa67a]" />
                (909) 376-5494
              </a>
              <span className="text-gray-300">|</span>
              <a href="mailto:yong.choi@russlyon.com" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors text-sm flex items-center gap-2">
                <Mail size={14} className="text-[#Bfa67a]" />
                yong.choi@russlyon.com
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 bg-[#0C1C2E] text-white px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all">
                <FileText size={14} />
                Request Custom Report
              </button>
              <button className="flex items-center gap-2 border border-gray-300 text-[#0C1C2E] px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:border-[#0C1C2E] transition-all">
                <Phone size={14} />
                Schedule Call
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-span-12 lg:col-span-3 flex flex-col justify-center gap-4">
            <div className="bg-[#F9F8F6] p-6 space-y-4">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#Bfa67a] font-bold">Report Coverage</span>
              {[
                { value: communityCount ? `${communityCount}` : '30+', label: 'Communities Analyzed' },
                { value: 'Q4 2024', label: 'Reporting Period' },
                { value: '$800K - $25M+', label: 'Price Range' },
                { value: 'Weekly', label: 'Update Frequency' },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-end border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</span>
                  <span className="text-sm font-serif text-[#0C1C2E]">{stat.value}</span>
                </div>
              ))}
            </div>

            <a
              href="https://www.yong-choi.com/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0C1C2E] p-6 group hover:bg-[#Bfa67a] transition-all"
            >
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#Bfa67a] group-hover:text-white font-bold block mb-2">Latest Insights</span>
              <h4 className="text-sm font-medium text-white leading-snug">
                5 Essential Financial Steps Before Investing In Real Estate
              </h4>
              <span className="text-[9px] uppercase tracking-[0.15em] text-white/60 font-bold mt-3 inline-flex items-center gap-1 group-hover:text-white transition-colors">
                Read More <ArrowRight size={10} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentContactSection;
