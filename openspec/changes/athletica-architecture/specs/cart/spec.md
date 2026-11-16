## Purpose

The product selection cart — customers add, remove, and change quantity of products identified by product ID, and the cart hands off to Amazon for purchase through the Amazon Affiliate Service.

## ADDED Requirements

### Requirement: Cart is a product selection cart
The system SHALL provide a cart that is a product selection cart, not a payment cart. Customers SHALL be able to add a product, remove a product, change quantity, and view selected products. The purchase happens on Amazon, not on Athletica.

#### Scenario: Add product to cart
- **WHEN** a customer adds a product to the cart
- **THEN** the product appears in the cart with its quantity

#### Scenario: Remove product from cart
- **WHEN** a customer removes a product from the cart
- **THEN** the product no longer appears in the cart

#### Scenario: Change quantity
- **WHEN** a customer changes the quantity of a product in the cart
- **THEN** the cart reflects the new quantity

### Requirement: Cart stores product identifiers
The system SHALL store enough information to identify the products in the cart — preferring product IDs and quantities rather than copying the entire product object — and SHALL retrieve current product information when the cart is viewed.

#### Scenario: Cart view shows current product info
- **WHEN** a customer views the cart
- **THEN** the application retrieves and displays the current product information for the stored product IDs

### Requirement: Cart hands off to Amazon
The system SHALL send the customer to Amazon using the cart's product ASINs, quantities, and the affiliate's Amazon Associate information. For a single product the system SHALL direct the customer to that product on Amazon; for multiple products the system SHALL attempt to create the appropriate Amazon cart destination containing the selected products. The exact Amazon multi-product URL/request format SHALL be verified against current Amazon affiliate capabilities during implementation.

#### Scenario: Single product to Amazon
- **WHEN** a customer clicks Buy on Amazon for one product in the cart
- **THEN** the system directs the customer to that product on Amazon using its ASIN and the affiliate information

#### Scenario: Multiple products to Amazon
- **WHEN** a customer clicks Continue to Amazon with multiple products in the cart
- **THEN** the system attempts to direct the customer to an Amazon cart destination containing the selected products