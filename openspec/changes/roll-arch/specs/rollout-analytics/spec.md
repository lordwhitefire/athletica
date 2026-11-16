## Purpose

Rollout Analytics is a deliberately limited feedback loop for the Production system. It answers four questions: are people looking at products, are people clicking toward Amazon, which products get attention, and which of the two platform tags (Instagram or WhatsApp) sent the visitor. It records product views and Amazon clicks per product, with only those two sources and no other traffic-source intelligence.

## ADDED Requirements

### Requirement: Rollout analytics events
The system SHALL record two event types per product in `rollout.analytics`: a product view (recorded server-side when the product page renders) and an Amazon click (recorded server-side by `/go/:id`). Each event SHALL carry the product, `source` (`instagram`, `whatsapp`, or `NULL`), and a daily `visitor_hash`; the raw IP SHALL NOT be stored. Known crawler, preview, and uptime user agents SHALL be skipped. Instagram and WhatsApp in-app browsers SHALL be treated as real visitors.

#### Scenario: View recorded
- **WHEN** a customer views a published Product Details page
- **THEN** a view event is recorded for that product

#### Scenario: Click recorded
- **WHEN** a customer clicks SHOP PRODUCT and reaches `/go/:id`
- **THEN** a click event is recorded for that product before the redirect

#### Scenario: Source recorded
- **WHEN** a customer arrives with `utm_source=instagram` or `utm_source=whatsapp`
- **THEN** the event's `source` is `instagram` or `whatsapp`; any other value is stored as `NULL`

#### Scenario: Bot is not counted
- **WHEN** a crawler, preview, or uptime monitor requests the page or the redirect
- **THEN** no event is recorded

### Requirement: Analytics privacy and rate limiting
The system SHALL record analytics server-side, SHALL NOT store raw IP addresses, and SHALL rate-limit events per `visitor_hash`. Analytics failures SHALL NOT block the product page or the Amazon redirect.

#### Scenario: No raw IP stored
- **WHEN** an event is stored
- **THEN** it contains a daily `visitor_hash`, not the visitor's IP address

#### Scenario: Over-limit event not counted
- **WHEN** a visitor exceeds the recording limit
- **THEN** the extra event is not counted, but the page still renders and the redirect still happens

### Requirement: Rollout analytics metrics
The system SHALL compute and display the Rollout 1 metrics only: Total Product Views, Total Amazon Clicks, CTR, Views per Product, Clicks per Product, and a source split for Instagram, WhatsApp, and Direct/unknown.

#### Scenario: KPI summary
- **WHEN** an admin opens Rollout Analytics
- **THEN** they see Total Product Views, Total Amazon Clicks, and CTR

#### Scenario: Per-product metrics
- **WHEN** an admin opens Rollout Analytics
- **THEN** they see Views per Product, Clicks per Product, and per-product CTR

### Requirement: Source split
The system SHALL show views and clicks split by the two platform tags (Instagram, WhatsApp) plus Direct/unknown, and SHALL show daily unique visitors per source. It SHALL NOT include any other traffic source.

#### Scenario: Two-tag split
- **WHEN** an admin opens Rollout Analytics
- **THEN** they see Instagram, WhatsApp, and Direct/unknown buckets

#### Scenario: Daily uniques per source
- **WHEN** an admin selects a date range
- **THEN** each source shows daily unique visitors based on `visitor_hash`

### Requirement: Date range presets
The system SHALL let an admin select a date range from presets (Last 7 days, Last 30 days, Last 90 days). Changing the range SHALL refetch and update KPIs, chart, product ranking, and source split.

#### Scenario: Change date range
- **WHEN** an admin changes the date range
- **THEN** loading occurs, data refetches, and KPIs, chart, ranking, and source split update

### Requirement: Analytics chart
The system SHALL provide a chart over time with metric tabs (Views, Clicks, CTR). The active tab SHALL be highlighted in lemon; only unrelated chart colors are excluded. Hover/focus SHALL show a tooltip, and an accessible tabular representation SHALL be provided for keyboard and screen-reader users.

#### Scenario: Switch chart metric
- **WHEN** an admin clicks a metric tab
- **THEN** the active series changes and the tab is highlighted in lemon

#### Scenario: Tooltip on hover/focus
- **WHEN** an admin hovers or focuses a chart point
- **THEN** a tooltip shows the date and value

### Requirement: Top products
The system SHALL show a product ranking with Rank, Product, Views, Clicks, and CTR. Clicking a product SHALL open `/admin/products/:id/edit`.

#### Scenario: Open product from ranking
- **WHEN** an admin clicks a product in the ranking
- **THEN** the product editor opens for that product

### Requirement: Analytics loading, error, and empty states
Rollout Analytics SHALL show skeletons while loading, a NO PRODUCT ACTIVITY YET empty state, and an ANALYTICS COULDN'T BE LOADED error state with TRY AGAIN. API failure SHALL never be turned into fake zeros.

#### Scenario: Empty state
- **WHEN** there is no product activity in the range
- **THEN** the page shows "NO PRODUCT ACTIVITY YET" / "Analytics will appear after customers begin viewing products."

#### Scenario: Error state
- **WHEN** analytics fail to load
- **THEN** the page shows "ANALYTICS COULDN'T BE LOADED" with a TRY AGAIN button, never fake zeros

### Requirement: Analytics scope boundary
Rollout Analytics SHALL include only the Rollout 1 metrics and the two platform tags (`instagram`, `whatsapp`). It SHALL NOT introduce other traffic sources, funnels, search analytics, brand analytics, category analytics, or advanced attribution.

#### Scenario: No advanced analytics
- **WHEN** an admin opens Rollout Analytics
- **THEN** they see only Views, Clicks, CTR, per-product metrics, and the Instagram/WhatsApp/Direct source split — no other traffic sources, funnels, search/brand/category analytics, or advanced attribution
