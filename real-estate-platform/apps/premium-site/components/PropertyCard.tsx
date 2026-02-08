import type { StandardProperty } from '@platform/shared';

interface PropertyCardProps {
  property: StandardProperty;
  href?: string;
}

export function PropertyCard({ property, href }: PropertyCardProps) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const CardWrapper = href ? 'a' : 'div';

  return (
    <CardWrapper
      href={href}
      className="group block rounded-lg border border-secondary-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-secondary-100 relative">
        {property.photos[0] ? (
          <img
            src={property.photos[0].url}
            alt={property.address}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-secondary-400">
            No Image
          </div>
        )}
        <span className={`absolute top-3 left-3 rounded-full px-2 py-1 text-xs font-medium ${
          property.status === 'Active' ? 'bg-green-100 text-green-800' :
          property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          property.status === 'Sold' ? 'bg-red-100 text-red-800' :
          'bg-secondary-100 text-secondary-800'
        }`}>
          {property.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xl font-bold text-secondary-900">
          {formatter.format(property.price)}
        </p>
        <p className="mt-1 text-sm text-secondary-500">
          {property.beds} beds • {property.baths} baths • {property.sqft.toLocaleString()} sqft
        </p>
        <p className="mt-2 text-sm text-secondary-700 truncate">
          {property.address}
        </p>
        <p className="text-sm text-secondary-500">
          {property.city}, {property.state} {property.zip}
        </p>
      </div>
    </CardWrapper>
  );
}
