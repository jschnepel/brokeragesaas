# MLS Field Dictionary

## Overview

This document provides a comprehensive reference for all property fields available through MLS integrations (ARMLS, Bridge) and how they map to our internal data model. Fields are organized by RESO Data Dictionary categories.

**Data Standard:** RESO Data Dictionary 1.7+
**Primary MLS:** ARMLS (Arizona Regional Multiple Listing Service)
**Secondary:** Bridge Interactive API

---

## Table of Contents

1. [Field Access by User Tier](#field-access-by-user-tier)
2. [Listing Identification Fields](#listing-identification-fields)
3. [Location Fields](#location-fields)
4. [Price Fields](#price-fields)
5. [Property Characteristics](#property-characteristics)
6. [Room Information](#room-information)
7. [Interior Features](#interior-features)
8. [Exterior Features](#exterior-features)
9. [Utilities & Systems](#utilities--systems)
10. [Lot & Land](#lot--land)
11. [HOA & Community](#hoa--community)
12. [Listing Information](#listing-information)
13. [Agent & Office Fields](#agent--office-fields)
14. [Media Fields](#media-fields)
15. [Tax & Assessment](#tax--assessment)
16. [Restricted Fields](#restricted-fields)
17. [Field Mapping Reference](#field-mapping-reference)

---

## Field Access by User Tier

### Access Matrix

| Category | Anonymous | Lead | Active Client |
|----------|-----------|------|---------------|
| Listing ID & Status | ✅ | ✅ | ✅ |
| Address & Location | ✅ | ✅ | ✅ |
| Price (Current) | ✅ | ✅ | ✅ |
| Price History | ❌ | Limited (1 yr) | ✅ Full |
| Basic Characteristics | ✅ | ✅ | ✅ |
| Room Details | ✅ | ✅ | ✅ |
| Interior Features | ✅ | ✅ | ✅ |
| Exterior Features | ✅ | ✅ | ✅ |
| Utilities | ❌ | Partial | ✅ |
| Lot Information | ✅ | ✅ | ✅ |
| HOA Information | ✅ | ✅ | ✅ |
| Listing Agent/Office | ✅ (Required) | ✅ | ✅ |
| Photos | ✅ | ✅ | ✅ |
| Virtual Tours | ✅ | ✅ | ✅ |
| Tax Records | ❌ | ❌ | ✅ |
| Days on Market | ✅ | ✅ | ✅ |
| Comparable Sales | ❌ | ❌ | ✅ |
| Private Remarks | ❌ | ❌ | ❌ |
| Showing Instructions | ❌ | ❌ | ❌ |

---

## Listing Identification Fields

### Core Identifiers

| RESO Field | Type | Description | Our Field | Required |
|------------|------|-------------|-----------|----------|
| `ListingId` | String | Unique MLS listing identifier | `external_id` | ✅ |
| `ListingKey` | String | System-generated unique key | `mls_key` | ✅ |
| `MlsNumber` | String | MLS number (may differ from ListingId) | `mls_number` | ✅ |
| `OriginatingSystemName` | String | Source MLS name | `data_source` | ✅ |
| `OriginatingSystemKey` | String | Key in originating system | `source_key` | |

### Status Fields

| RESO Field | Type | Description | Our Field | Values |
|------------|------|-------------|-----------|--------|
| `StandardStatus` | Enum | Standardized listing status | `status` | Active, ActiveUnderContract, Pending, Closed, Canceled, Withdrawn, Expired, ComingSoon, Delete |
| `MlsStatus` | String | MLS-specific status | `mls_status` | Varies by MLS |
| `ContingentDate` | Date | Date became contingent | `contingent_date` | |
| `PendingTimestamp` | DateTime | When went pending | `pending_at` | |
| `CancellationDate` | Date | Cancellation date | `canceled_at` | |
| `WithdrawnDate` | Date | Withdrawal date | `withdrawn_at` | |
| `ExpirationDate` | Date | Listing expiration | `expires_at` | |
| `CloseDate` | Date | Closing date | `sold_at` | |

### Status Mapping

```typescript
// RESO StandardStatus → Internal Status
const statusMap = {
  'Active': 'Active',
  'ActiveUnderContract': 'Active Under Contract',
  'Pending': 'Pending',
  'Closed': 'Sold',
  'Canceled': 'Off Market',
  'Withdrawn': 'Off Market',
  'Expired': 'Off Market',
  'ComingSoon': 'Coming Soon',
  'Delete': 'Deleted'
};
```

---

## Location Fields

### Address Components

| RESO Field | Type | Description | Our Field | Example |
|------------|------|-------------|-----------|---------|
| `StreetNumber` | String | Street number | `street_number` | "123" |
| `StreetNumberNumeric` | Integer | Numeric street number | - | 123 |
| `StreetDirPrefix` | String | Direction prefix | `street_dir_prefix` | "N", "E" |
| `StreetName` | String | Street name | `street_name` | "Main" |
| `StreetSuffix` | String | Street type | `street_suffix` | "St", "Ave", "Blvd" |
| `StreetDirSuffix` | String | Direction suffix | `street_dir_suffix` | "NW" |
| `UnitNumber` | String | Unit/Apt number | `unit_number` | "101" |
| `City` | String | City name | `city` | "Phoenix" |
| `StateOrProvince` | String | State abbreviation | `state` | "AZ" |
| `PostalCode` | String | ZIP code | `zip` | "85001" |
| `PostalCodePlus4` | String | ZIP+4 | `zip_plus4` | "1234" |
| `County` | String | County name | `county` | "Maricopa" |
| `Country` | String | Country code | `country` | "US" |

### Computed Address

```typescript
// Full address composition
const fullAddress = [
  streetNumber,
  streetDirPrefix,
  streetName,
  streetSuffix,
  streetDirSuffix,
  unitNumber ? `#${unitNumber}` : ''
].filter(Boolean).join(' ');

// Display address
const displayAddress = `${fullAddress}, ${city}, ${state} ${zip}`;
```

### Geographic Coordinates

| RESO Field | Type | Description | Our Field | Format |
|------------|------|-------------|-----------|--------|
| `Latitude` | Decimal | Latitude coordinate | `latitude` | 33.4484 |
| `Longitude` | Decimal | Longitude coordinate | `longitude` | -112.0740 |
| `Coordinates` | Point | Combined lat/long | `location` | GEOGRAPHY(POINT) |

### Geographic Areas

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `SubdivisionName` | String | Subdivision/neighborhood | `subdivision` |
| `MLSAreaMajor` | String | Major MLS area | `mls_area_major` |
| `MLSAreaMinor` | String | Minor MLS area | `mls_area_minor` |
| `Directions` | String | Directions to property | `directions` |
| `CrossStreet` | String | Nearest cross street | `cross_street` |
| `ParcelNumber` | String | Tax parcel number | `parcel_number` |

---

## Price Fields

### Current Pricing

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `ListPrice` | Decimal | Current list price | `price` | ✅ All |
| `OriginalListPrice` | Decimal | Original list price | `original_price` | Lead+ |
| `PreviousListPrice` | Decimal | Previous list price | `previous_price` | Lead+ |
| `ClosePrice` | Decimal | Sold price | `sold_price` | Lead+ |

### Price Metrics

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `PricePerSquareFoot` | Decimal | Price per sqft (calculated) | `price_per_sqft` | ✅ All |
| `ListPriceLow` | Decimal | Low end of price range | `price_low` | |
| `ListPriceHigh` | Decimal | High end of price range | `price_high` | |

### Price Change Tracking

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `PriceChangeTimestamp` | DateTime | Last price change | `price_changed_at` | Lead+ |
| `OriginalEntryTimestamp` | DateTime | Original listing date | `original_listed_at` | |

### Price History (Computed)

```typescript
interface PriceHistory {
  date: Date;
  price: number;
  changeType: 'initial' | 'increase' | 'decrease';
  changeAmount: number;
  changePercent: number;
}

// Access by tier
// Anonymous: No history
// Lead: Last 12 months, max 5 changes
// Active Client: Full history
```

---

## Property Characteristics

### Basic Characteristics

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `PropertyType` | Enum | Property type | `property_type` | ✅ All |
| `PropertySubType` | Enum | Subtype | `property_subtype` | ✅ All |
| `BedroomsTotal` | Integer | Total bedrooms | `beds` | ✅ All |
| `BathroomsFull` | Integer | Full bathrooms | `baths_full` | ✅ All |
| `BathroomsHalf` | Integer | Half bathrooms | `baths_half` | ✅ All |
| `BathroomsTotalInteger` | Integer | Total baths (integer) | `baths` | ✅ All |
| `BathroomsThreeQuarter` | Integer | 3/4 bathrooms | `baths_three_quarter` | |
| `LivingArea` | Integer | Living area sqft | `sqft` | ✅ All |
| `LivingAreaUnits` | String | Sqft unit | - | "SquareFeet" |
| `YearBuilt` | Integer | Year constructed | `year_built` | ✅ All |
| `Stories` | Integer | Number of stories | `stories` | ✅ All |
| `StoriesTotal` | Integer | Total building stories | `stories_total` | |

### Property Type Values

```typescript
// RESO PropertyType enum values
type PropertyType =
  | 'Residential'
  | 'ResidentialIncome'
  | 'ResidentialLease'
  | 'Land'
  | 'Commercial'
  | 'CommercialLease'
  | 'Farm'
  | 'BusinessOpportunity';

// RESO PropertySubType enum values (Residential)
type ResidentialSubType =
  | 'Apartment'
  | 'BoatSlip'
  | 'Cabin'
  | 'Condominium'
  | 'DeededParking'
  | 'Duplex'
  | 'Farm'
  | 'ManufacturedHome'
  | 'ManufacturedOnLand'
  | 'MobileHome'
  | 'OwnYourOwn'
  | 'Quadruplex'
  | 'SingleFamilyResidence'
  | 'StockCooperative'
  | 'Timeshare'
  | 'Townhouse'
  | 'Triplex';
```

### Building Details

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `ArchitecturalStyle` | StringList | Architectural styles | `architectural_style` |
| `BuildingAreaTotal` | Integer | Total building area | `building_area_total` |
| `BuildingAreaSource` | String | Area measurement source | `area_source` |
| `FoundationType` | StringList | Foundation types | `foundation_type` |
| `Roof` | StringList | Roof types | `roof` |
| `ConstructionMaterials` | StringList | Construction materials | `construction` |
| `NewConstructionYN` | Boolean | New construction | `is_new_construction` |
| `YearBuiltEffective` | Integer | Effective year built | `year_built_effective` |
| `YearBuiltSource` | String | Year built source | `year_built_source` |

---

## Room Information

### Room Summary

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `RoomsTotal` | Integer | Total rooms | `rooms_total` |
| `MainLevelBedrooms` | Integer | Main level bedrooms | `main_level_beds` |
| `MainLevelBathrooms` | Integer | Main level bathrooms | `main_level_baths` |
| `AboveGradeFinishedArea` | Integer | Above grade sqft | `above_grade_sqft` |
| `BelowGradeFinishedArea` | Integer | Below grade sqft | `below_grade_sqft` |
| `BasementYN` | Boolean | Has basement | `has_basement` |
| `BasementFinishedPercent` | Integer | Basement finished % | `basement_finished_pct` |

### Room Details (RESO Rooms Resource)

```typescript
interface Room {
  RoomKey: string;
  RoomType: RoomType;
  RoomLevel: string;           // 'Main', 'Upper', 'Lower', 'Basement'
  RoomDimensions: string;      // "12x14"
  RoomLength: number;
  RoomWidth: number;
  RoomArea: number;            // Calculated sqft
  RoomFeatures: string[];
  RoomDescription: string;
}

type RoomType =
  | 'Bathroom'
  | 'Bedroom'
  | 'BonusRoom'
  | 'DiningRoom'
  | 'FamilyRoom'
  | 'Garage'
  | 'GreatRoom'
  | 'Kitchen'
  | 'Laundry'
  | 'LivingRoom'
  | 'MasterBathroom'
  | 'MasterBedroom'
  | 'Office'
  | 'RecreationRoom'
  | 'Other';
```

---

## Interior Features

### General Interior

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `InteriorFeatures` | StringList | Interior feature list | `interior_features` |
| `Flooring` | StringList | Flooring types | `flooring` |
| `WindowFeatures` | StringList | Window features | `window_features` |
| `DoorFeatures` | StringList | Door features | `door_features` |
| `FireplaceYN` | Boolean | Has fireplace | `has_fireplace` |
| `FireplacesTotal` | Integer | Number of fireplaces | `fireplaces` |
| `FireplaceFeatures` | StringList | Fireplace details | `fireplace_features` |

### Interior Feature Values

```typescript
// Common InteriorFeatures values
const interiorFeatures = [
  'Breakfast Bar',
  'Built-in Features',
  'Ceiling Fan(s)',
  'Crown Molding',
  'Double Vanity',
  'Eat-in Kitchen',
  'Entrance Foyer',
  'High Ceilings',
  'In-Law Floorplan',
  'Kitchen Island',
  'Open Floorplan',
  'Pantry',
  'Recessed Lighting',
  'Smart Home',
  'Vaulted Ceiling(s)',
  'Walk-In Closet(s)',
  'Wet Bar'
];
```

### Kitchen & Laundry

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `Appliances` | StringList | Appliance list | `appliances` |
| `LaundryFeatures` | StringList | Laundry features | `laundry_features` |

```typescript
// Common Appliances values
const appliances = [
  'Built-In Electric Oven',
  'Built-In Gas Oven',
  'Cooktop',
  'Dishwasher',
  'Disposal',
  'Double Oven',
  'Dryer',
  'Gas Range',
  'Ice Maker',
  'Microwave',
  'Oven',
  'Range',
  'Refrigerator',
  'Tankless Water Heater',
  'Washer',
  'Wine Cooler'
];
```

---

## Exterior Features

### General Exterior

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `ExteriorFeatures` | StringList | Exterior feature list | `exterior_features` |
| `PatioAndPorchFeatures` | StringList | Patio/porch features | `patio_features` |
| `Fencing` | StringList | Fencing types | `fencing` |
| `OtherStructures` | StringList | Other structures | `other_structures` |
| `View` | StringList | View types | `view` |
| `WaterfrontYN` | Boolean | Waterfront property | `is_waterfront` |
| `WaterfrontFeatures` | StringList | Waterfront details | `waterfront_features` |

### Parking & Garage

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `GarageYN` | Boolean | Has garage | `has_garage` |
| `GarageSpaces` | Decimal | Garage spaces | `garage_spaces` |
| `AttachedGarageYN` | Boolean | Garage attached | `garage_attached` |
| `CarportYN` | Boolean | Has carport | `has_carport` |
| `CarportSpaces` | Decimal | Carport spaces | `carport_spaces` |
| `ParkingFeatures` | StringList | Parking features | `parking_features` |
| `ParkingTotal` | Decimal | Total parking | `parking_total` |
| `CoveredSpaces` | Decimal | Covered parking | `covered_spaces` |
| `OpenParkingSpaces` | Decimal | Open parking | `open_parking_spaces` |
| `RVParkingDimensions` | String | RV parking size | `rv_parking` |

### Pool & Spa

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `PoolPrivateYN` | Boolean | Has private pool | `has_pool` |
| `PoolFeatures` | StringList | Pool features | `pool_features` |
| `SpaYN` | Boolean | Has spa | `has_spa` |
| `SpaFeatures` | StringList | Spa features | `spa_features` |

```typescript
// Common PoolFeatures values (Arizona-specific)
const poolFeatures = [
  'Above Ground',
  'Black Bottom',
  'Community',
  'Diving Board',
  'Fenced',
  'Gunite',
  'Heated',
  'In Ground',
  'Pebble',
  'Play Pool',
  'Pool Cover',
  'Pool Sweep',
  'Pool/Spa Combo',
  'Private',
  'Salt Water',
  'Waterfall'
];
```

---

## Utilities & Systems

### Heating & Cooling

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `Heating` | StringList | Heating types | `heating` | Lead+ |
| `HeatingYN` | Boolean | Has heating | `has_heating` | |
| `Cooling` | StringList | Cooling types | `cooling` | Lead+ |
| `CoolingYN` | Boolean | Has cooling | `has_cooling` | |

```typescript
// Arizona-specific Cooling values
const coolingTypes = [
  'Central Air',
  'Ceiling Fan(s)',
  'ENERGY STAR Qualified Equipment',
  'Evaporative Cooling',
  'Heat Pump',
  'Mini Split',
  'Multi Units',
  'None',
  'Programmable Thermostat',
  'Refrigeration',
  'Zoned'
];
```

### Utilities

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `Utilities` | StringList | Available utilities | `utilities` | Active Client |
| `Electric` | StringList | Electric details | `electric` | Active Client |
| `Gas` | StringList | Gas details | `gas` | Active Client |
| `Sewer` | StringList | Sewer type | `sewer` | Lead+ |
| `WaterSource` | StringList | Water source | `water_source` | Lead+ |
| `InternetServices` | StringList | Internet available | `internet` | Lead+ |

### Security & Systems

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `SecurityFeatures` | StringList | Security features | `security_features` |
| `GreenEnergyEfficient` | StringList | Green features | `green_features` |
| `GreenEnergyGeneration` | StringList | Solar/energy gen | `energy_generation` |
| `PowerProductionType` | StringList | Power production | `power_production` |
| `ElectricOnPropertyYN` | Boolean | Electric on property | `has_electric` |
| `GasCompany` | String | Gas provider | `gas_company` |

---

## Lot & Land

### Lot Dimensions

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `LotSizeArea` | Decimal | Lot size | `lot_size` | ✅ All |
| `LotSizeUnits` | String | Lot size unit | `lot_size_units` | ✅ All |
| `LotSizeAcres` | Decimal | Lot in acres | `lot_acres` | ✅ All |
| `LotSizeSquareFeet` | Integer | Lot in sqft | `lot_sqft` | ✅ All |
| `LotSizeDimensions` | String | Lot dimensions | `lot_dimensions` | |
| `LotDimensionsSource` | String | Dimension source | - | |

### Lot Features

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `LotFeatures` | StringList | Lot feature list | `lot_features` |
| `Topography` | String | Land topography | `topography` |
| `Vegetation` | StringList | Vegetation types | `vegetation` |
| `HorseYN` | Boolean | Horse property | `is_horse_property` |
| `HorseAmenities` | StringList | Horse amenities | `horse_amenities` |
| `FrontageLength` | String | Road frontage | `frontage_length` |
| `FrontageType` | StringList | Frontage types | `frontage_type` |

### Zoning

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `Zoning` | String | Zoning code | `zoning` |
| `ZoningDescription` | String | Zoning description | `zoning_description` |
| `CurrentUse` | StringList | Current land use | `current_use` |
| `PossibleUse` | StringList | Possible uses | `possible_use` |

---

## HOA & Community

### HOA Information

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `AssociationYN` | Boolean | Has HOA | `has_hoa` | ✅ All |
| `AssociationFee` | Decimal | HOA fee amount | `hoa_fee` | ✅ All |
| `AssociationFeeFrequency` | String | Fee frequency | `hoa_fee_frequency` | ✅ All |
| `AssociationFee2` | Decimal | Secondary HOA fee | `hoa_fee_2` | |
| `AssociationFee2Frequency` | String | Fee 2 frequency | `hoa_fee_2_frequency` | |
| `AssociationFeeIncludes` | StringList | What's included | `hoa_includes` | ✅ All |
| `AssociationName` | String | HOA name | `hoa_name` | |
| `AssociationPhone` | String | HOA phone | `hoa_phone` | Active Client |

### HOA Fee Frequency Values

```typescript
type AssociationFeeFrequency =
  | 'Monthly'
  | 'Quarterly'
  | 'Semi-Annually'
  | 'Annually'
  | 'BiWeekly'
  | 'Weekly'
  | 'Seasonal';
```

### Community Features

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `CommunityFeatures` | StringList | Community amenities | `community_features` |
| `SeniorCommunityYN` | Boolean | 55+ community | `is_senior_community` |
| `LandLeaseYN` | Boolean | Land lease | `is_land_lease` |
| `LandLeaseAmount` | Decimal | Lease amount | `land_lease_amount` |

```typescript
// Common CommunityFeatures values
const communityFeatures = [
  'Biking/Hiking Path',
  'Clubhouse',
  'Fitness Center',
  'Gate Staffed',
  'Gated Community',
  'Golf',
  'Lake',
  'Park',
  'Playground',
  'Pool',
  'Tennis Court(s)'
];
```

---

## Listing Information

### Listing Dates

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `ListingContractDate` | Date | Contract date | `listed_at` | ✅ All |
| `OnMarketDate` | Date | On market date | `on_market_date` | ✅ All |
| `OriginalEntryTimestamp` | DateTime | Original entry | `original_listed_at` | |
| `ModificationTimestamp` | DateTime | Last modified | `updated_at` | ✅ All |
| `DaysOnMarket` | Integer | Days on market | `days_on_market` | ✅ All |
| `CumulativeDaysOnMarket` | Integer | Cumulative DOM | `cumulative_dom` | Lead+ |

### Listing Details

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `PublicRemarks` | Text | Public description | `description` | ✅ All |
| `SyndicationRemarks` | Text | Syndication description | `syndication_remarks` | |
| `Inclusions` | Text | What's included | `inclusions` | ✅ All |
| `Exclusions` | Text | What's excluded | `exclusions` | ✅ All |

### Showing Information

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `ShowingInstructions` | Text | Showing instructions | - | ❌ NEVER |
| `ShowingRequirements` | StringList | Showing requirements | `showing_requirements` | |
| `LockBoxType` | String | Lockbox type | - | ❌ NEVER |
| `LockBoxSerialNumber` | String | Lockbox serial | - | ❌ NEVER |
| `AccessCode` | String | Access code | - | ❌ NEVER |

### Listing Type

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `ListingAgreement` | String | Listing type | `listing_agreement` |
| `SpecialListingConditions` | StringList | Special conditions | `special_conditions` |
| `Ownership` | String | Ownership type | `ownership_type` |

---

## Agent & Office Fields

### Listing Agent (Required Display)

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `ListAgentKey` | String | Agent unique key | `listing_agent_key` | |
| `ListAgentMlsId` | String | Agent MLS ID | `listing_agent_mls_id` | |
| `ListAgentFullName` | String | Agent full name | `listing_agent_name` | ✅ Required |
| `ListAgentFirstName` | String | Agent first name | `listing_agent_first_name` | |
| `ListAgentLastName` | String | Agent last name | `listing_agent_last_name` | |
| `ListAgentEmail` | String | Agent email | `listing_agent_email` | ✅ Required* |
| `ListAgentDirectPhone` | String | Agent phone | `listing_agent_phone` | ✅ Required* |
| `ListAgentPreferredPhone` | String | Preferred phone | `listing_agent_preferred_phone` | |
| `ListAgentStateLicense` | String | License number | `listing_agent_license` | |

*At least one contact method (email or phone) required for IDX compliance

### Listing Office (Required Display)

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `ListOfficeKey` | String | Office unique key | `listing_office_key` | |
| `ListOfficeMlsId` | String | Office MLS ID | `listing_office_mls_id` | |
| `ListOfficeName` | String | Office name | `listing_office_name` | ✅ Required |
| `ListOfficePhone` | String | Office phone | `listing_office_phone` | |
| `ListOfficeEmail` | String | Office email | `listing_office_email` | |

### Co-Listing Agent (if applicable)

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `CoListAgentKey` | String | Co-agent key | `co_listing_agent_key` |
| `CoListAgentFullName` | String | Co-agent name | `co_listing_agent_name` |
| `CoListAgentEmail` | String | Co-agent email | `co_listing_agent_email` |
| `CoListAgentPhone` | String | Co-agent phone | `co_listing_agent_phone` |
| `CoListOfficeName` | String | Co-listing office | `co_listing_office_name` |

---

## Media Fields

### Photos

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `Media` | Array | Media resources | `photos` |

```typescript
interface MediaResource {
  MediaKey: string;
  MediaURL: string;
  MediaCategory: MediaCategory;
  MimeType: string;
  Order: number;
  ShortDescription: string;
  LongDescription: string;
  MediaModificationTimestamp: string;
  ImageHeight: number;
  ImageWidth: number;
  ImageSizeDescription: string;  // 'Thumbnail', 'Medium', 'Large'
}

type MediaCategory =
  | 'Photo'
  | 'Video'
  | 'VirtualTour'
  | 'FloorPlan'
  | 'Document'
  | 'BrandedVirtualTour'
  | 'UnbrandedVirtualTour';
```

### Photo Processing

```typescript
// Photo array transformation
interface PropertyPhoto {
  url: string;
  thumbnailUrl: string;
  order: number;
  caption: string;
  width: number;
  height: number;
}

function transformPhotos(media: MediaResource[]): PropertyPhoto[] {
  return media
    .filter(m => m.MediaCategory === 'Photo')
    .sort((a, b) => a.Order - b.Order)
    .map(m => ({
      url: m.MediaURL,
      thumbnailUrl: generateThumbnail(m.MediaURL),
      order: m.Order,
      caption: m.ShortDescription || '',
      width: m.ImageWidth,
      height: m.ImageHeight
    }));
}
```

### Virtual Tours

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `VirtualTourURLUnbranded` | String | Unbranded tour URL | `virtual_tour_url` |
| `VirtualTourURLBranded` | String | Branded tour URL | `virtual_tour_branded_url` |

---

## Tax & Assessment

### Tax Information (Active Client Only)

| RESO Field | Type | Description | Our Field | Display |
|------------|------|-------------|-----------|---------|
| `TaxYear` | Integer | Tax year | `tax_year` | Active Client |
| `TaxAnnualAmount` | Decimal | Annual taxes | `annual_taxes` | Active Client |
| `TaxAssessedValue` | Decimal | Assessed value | `tax_assessed_value` | Active Client |
| `TaxLot` | String | Tax lot | `tax_lot` | Active Client |
| `TaxTractNumber` | String | Tax tract | `tax_tract` | Active Client |
| `TaxLegalDescription` | String | Legal description | `legal_description` | Active Client |

### Assessment Details

| RESO Field | Type | Description | Our Field |
|------------|------|-------------|-----------|
| `AssociationFeeAnnualAmount` | Decimal | Annual HOA | `hoa_annual` |
| `TaxBookNumber` | String | Tax book | `tax_book` |
| `TaxMapNumber` | String | Tax map | `tax_map` |

---

## Restricted Fields

### Never Display (IDX/VOW Prohibited)

| RESO Field | Description | Reason |
|------------|-------------|--------|
| `PrivateRemarks` | Agent-to-agent notes | Confidential |
| `ShowingInstructions` | How to show | Security |
| `LockBoxType` | Lockbox type | Security |
| `LockBoxSerialNumber` | Lockbox serial | Security |
| `LockBoxLocation` | Lockbox location | Security |
| `AccessCode` | Property access code | Security |
| `SellerPhone` | Seller phone number | Privacy |
| `SellerEmail` | Seller email | Privacy |
| `SellerName` | Seller name | Privacy |
| `OccupantName` | Occupant name | Privacy |
| `OccupantPhone` | Occupant phone | Privacy |
| `ListingServiceAreaNote` | Internal MLS notes | Internal |
| `BuyerAgentKey` | Buyer agent info (sold) | Privacy |
| `BuyerAgentFullName` | Buyer agent name | Privacy |
| `BuyerOfficeKey` | Buyer office info | Privacy |

### Compliance Filter

```typescript
// Fields to always filter from API responses
const RESTRICTED_FIELDS = [
  'PrivateRemarks',
  'ShowingInstructions',
  'LockBoxType',
  'LockBoxSerialNumber',
  'LockBoxLocation',
  'AccessCode',
  'SellerPhone',
  'SellerEmail',
  'SellerName',
  'OccupantName',
  'OccupantPhone',
  'BuyerAgentKey',
  'BuyerAgentFullName',
  'BuyerOfficeKey'
];

function sanitizeListingData(listing: MLSListing): SafeListing {
  const sanitized = { ...listing };
  RESTRICTED_FIELDS.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
}
```

---

## Field Mapping Reference

### StandardProperty Interface

```typescript
// Complete StandardProperty interface for internal use
interface StandardProperty {
  // Identification
  id: string;                          // Internal UUID
  external_id: string;                 // MLS ListingId
  mls_number: string;                  // MLS number
  data_source: 'armls' | 'bridge' | 'manual';

  // Location
  address: string;                     // Full street address
  street_number: string;
  street_name: string;
  street_suffix: string;
  unit_number: string | null;
  city: string;
  state: string;
  zip: string;
  county: string;
  subdivision: string | null;
  latitude: number;
  longitude: number;
  location: Point;                     // PostGIS geography

  // Price
  price: number;
  original_price: number | null;
  price_per_sqft: number;
  sold_price: number | null;

  // Characteristics
  property_type: string;
  property_subtype: string;
  beds: number;
  baths: number;
  baths_full: number;
  baths_half: number;
  sqft: number;
  lot_size: number;
  lot_size_units: 'acres' | 'sqft';
  year_built: number;
  stories: number;

  // Status
  status: PropertyStatus;
  days_on_market: number;
  listed_at: Date;
  sold_at: Date | null;

  // Description
  description: string;
  features: string[];
  interior_features: string[];
  exterior_features: string[];
  appliances: string[];

  // Parking & Pool
  has_garage: boolean;
  garage_spaces: number;
  parking_total: number;
  has_pool: boolean;
  pool_features: string[];

  // HOA
  has_hoa: boolean;
  hoa_fee: number | null;
  hoa_fee_frequency: string | null;

  // Photos
  photos: PropertyPhoto[];
  virtual_tour_url: string | null;

  // Attribution (Required for IDX)
  listing_office_name: string;         // Required
  listing_agent_name: string;          // Required
  listing_agent_phone: string | null;  // Required (or email)
  listing_agent_email: string | null;  // Required (or phone)

  // Metadata
  mls_data: object;                    // Raw MLS response
  created_at: Date;
  updated_at: Date;
}

type PropertyStatus =
  | 'Active'
  | 'Active Under Contract'
  | 'Pending'
  | 'Sold'
  | 'Off Market'
  | 'Coming Soon'
  | 'Deleted';
```

### ARMLS to StandardProperty Mapping

```typescript
// ARMLS field mapping
const armlsFieldMap = {
  // Identification
  'ListingId': 'external_id',
  'MlsNumber': 'mls_number',

  // Location
  'StreetNumber': 'street_number',
  'StreetName': 'street_name',
  'StreetSuffix': 'street_suffix',
  'UnitNumber': 'unit_number',
  'City': 'city',
  'StateOrProvince': 'state',
  'PostalCode': 'zip',
  'County': 'county',
  'SubdivisionName': 'subdivision',
  'Latitude': 'latitude',
  'Longitude': 'longitude',

  // Price
  'ListPrice': 'price',
  'OriginalListPrice': 'original_price',
  'ClosePrice': 'sold_price',

  // Characteristics
  'PropertyType': 'property_type',
  'PropertySubType': 'property_subtype',
  'BedroomsTotal': 'beds',
  'BathroomsTotalInteger': 'baths',
  'BathroomsFull': 'baths_full',
  'BathroomsHalf': 'baths_half',
  'LivingArea': 'sqft',
  'LotSizeAcres': 'lot_size',
  'YearBuilt': 'year_built',
  'Stories': 'stories',

  // Status
  'StandardStatus': 'status',
  'DaysOnMarket': 'days_on_market',
  'ListingContractDate': 'listed_at',
  'CloseDate': 'sold_at',

  // Description
  'PublicRemarks': 'description',
  'InteriorFeatures': 'interior_features',
  'ExteriorFeatures': 'exterior_features',
  'Appliances': 'appliances',

  // Parking & Pool
  'GarageYN': 'has_garage',
  'GarageSpaces': 'garage_spaces',
  'ParkingTotal': 'parking_total',
  'PoolPrivateYN': 'has_pool',
  'PoolFeatures': 'pool_features',

  // HOA
  'AssociationYN': 'has_hoa',
  'AssociationFee': 'hoa_fee',
  'AssociationFeeFrequency': 'hoa_fee_frequency',

  // Media
  'Media': 'photos',
  'VirtualTourURLUnbranded': 'virtual_tour_url',

  // Attribution
  'ListOfficeName': 'listing_office_name',
  'ListAgentFullName': 'listing_agent_name',
  'ListAgentDirectPhone': 'listing_agent_phone',
  'ListAgentEmail': 'listing_agent_email'
};
```

---

## Resources

### Official References
- [RESO Data Dictionary](https://ddwiki.reso.org/)
- [RESO Web API](https://www.reso.org/reso-web-api/)
- [ARMLS Rules & Regulations](https://armls.com/rules)

### Internal Documentation
- [MLS Adapter Pattern](../architecture/03-mls-adapter-pattern.md)
- [Database Schema](../architecture/01-database-schema.md)
- [IDX Compliance](../compliance/idx-compliance.md)
- [VOW Compliance](../compliance/vow-compliance.md)

---

*Document Version: 1.0*
*Created: February 2026*
*Based on: RESO Data Dictionary 1.7+*
*Review Cycle: When RESO updates*
