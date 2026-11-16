## Purpose

Business-focused analytics measuring the path from Athletica to Amazon — product views, Amazon clicks, click-through rate, and top products, brands, and categories — so the owner knows what is getting attention.

## ADDED Requirements

### Requirement: Measure the business path to Amazon
The system SHALL measure product views, Amazon clicks, and click-through rate, and SHALL surface top products, top brands, and top categories. Search activity and traffic sources SHALL be captured where available.

#### Scenario: Product view recorded
- **WHEN** a customer views a product
- **THEN** the system records a product view

#### Scenario: Amazon click recorded
- **WHEN** a customer clicks through to Amazon
- **THEN** the system records an Amazon click for that product

#### Scenario: Top products shown
- **WHEN** the owner views analytics
- **THEN** the system shows the top products, brands, and categories by clicks or views

### Requirement: Analytics answer business questions
The system SHALL present analytics that answer: what is getting attention, what are people clicking, which products should the owner care about, and what needs attention. The system SHALL NOT build complicated analytics just for the sake of having charts.

#### Scenario: Dashboard answers what is getting attention
- **WHEN** the owner opens the analytics overview
- **THEN** it shows what products are getting views and clicks

#### Scenario: No speculative analytics
- **WHEN** analytics are designed
- **THEN** only measurements that serve the business goal of getting people from Athletica to Amazon are included