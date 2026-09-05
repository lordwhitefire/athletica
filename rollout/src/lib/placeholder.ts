// Placeholder content for fields not yet backed by real database data.
// Temporary until ROLL-07 admin editor enters real content.

// ROLL-06 D3: "what's inside the box" mock items, rendered on the customer
// page only while box_contents is empty. Replaced when the admin editor exists.
export function mockBoxContents(productName: string): string[] {
  return [`1 × ${productName}`, 'Pair of spare laces', 'Dust bag'];
}

// Stable Unsplash photo shown under the mock box contents.
export const FALLBACK_BOX_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80';

// Product thumbnail fallback when main_image is null.
export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80';