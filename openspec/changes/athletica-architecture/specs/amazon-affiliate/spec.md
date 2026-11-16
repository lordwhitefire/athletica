## Purpose

The isolated Amazon affiliate service — the only place that builds Amazon product and cart links, holds affiliate configuration, and validates Amazon product data.

## ADDED Requirements

### Requirement: One place for Amazon affiliate behavior
The system SHALL provide one service responsible for all Amazon affiliate behavior: building a product link, building a cart link, retrieving affiliate configuration, and validating Amazon product data. The rest of the application SHALL NOT build Amazon URLs manually.

#### Scenario: Product link built by service
- **WHEN** any part of the application needs an Amazon product link
- **THEN** it asks the affiliate service and the service builds the link

#### Scenario: No manual Amazon URLs elsewhere
- **WHEN** code outside the affiliate service needs an Amazon destination
- **THEN** it does not construct the Amazon URL itself

### Requirement: Product link generation
The system SHALL generate a link to a product on Amazon from the product's ASIN, quantity, and the configured Amazon Associate/affiliate information.

#### Scenario: Buy on Amazon link
- **WHEN** a customer clicks Buy on Amazon for a product
- **THEN** the service returns a link to that product on Amazon carrying the affiliate information

### Requirement: Cart link generation
The system SHALL attempt to generate an Amazon cart destination link containing multiple selected products from their ASINs and quantities.

#### Scenario: Multi-product Amazon cart link
- **WHEN** a customer has multiple products selected
- **THEN** the service attempts to build an Amazon cart link containing the selected ASINs and quantities

### Requirement: Affiliate configuration
The system SHALL store and expose the Amazon Associate/affiliate configuration in one place through the service.

#### Scenario: Affiliate settings applied to links
- **WHEN** the affiliate service builds a link
- **THEN** the link includes the configured Amazon Associate information

### Requirement: Amazon product data validation
The system SHALL validate Amazon product data — at minimum, presence and well-formedness of the ASIN — and SHALL report products with missing or invalid Amazon data.

#### Scenario: Missing ASIN reported
- **WHEN** a product has no ASIN
- **THEN** validation reports the product as missing Amazon data

### Requirement: Product database stores identifiers only
The product database SHALL store only the Amazon product identifier and related product information; it SHALL NOT contain Amazon URL logic. The frontend SHALL NOT need to understand Amazon's URL rules.

#### Scenario: ASIN stored in product database
- **WHEN** a product record contains Amazon data
- **THEN** it contains the ASIN identifier, and all URL construction happens in the affiliate service