import { defineType, defineField } from "sanity"

export default defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "hero_carousel",
      title: "Hero Carousel",
      type: "object",
      fields: [
        { name: "id", type: "string", title: "ID" },
        { name: "auto_switch_ms", type: "number", title: "Auto Switch (ms)" },
        {
          name: "banners",
          type: "array",
          title: "Banners",
          of: [
            {
              type: "object",
              fields: [
                { name: "id", type: "string", title: "ID" },
                { name: "title", type: "string", title: "Title" },
                { name: "subtitle", type: "string", title: "Subtitle" },
                { name: "button_text", type: "string", title: "Button Text" },
                { name: "link", type: "string", title: "Link" },
                { name: "gradient", type: "string", title: "Gradient" },
                { name: "accent_color", type: "string", title: "Accent Color" },
                { name: "image", type: "image", title: "Banner Image" },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        {
          type: "object",
          name: "category_grid",
          title: "Category Grid",
          fields: [
            { name: "id", type: "string", title: "ID" },
            { name: "type", type: "string", title: "Type", readOnly: true },
            { name: "title", type: "string", title: "Title" },
            { name: "variant", type: "string", title: "Variant" },
            { name: "bg", type: "string", title: "Background" },
            { name: "snapshot", type: "image", title: "Snapshot", description: "Admin-captured thumbnail for the overview grid" },
            { name: "viewAllLink", type: "string", title: "View All Link" },
            { name: "viewAllLabel", type: "string", title: "View All Label" },
            {
              name: "items",
              type: "array",
              title: "Items",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "label", type: "string", title: "Label" },
                    { name: "link", type: "string", title: "Link" },
                    { name: "image", type: "image", title: "Category Image" },
                    { name: "bg", type: "string", title: "Background" },
                    { name: "textColor", type: "string", title: "Text Color" },
                    { name: "accent", type: "string", title: "Accent" },
                  ],
                  preview: { select: { title: "label" } },
                },
              ],
            },
          ],
          preview: { select: { title: "title" } },
        },
        {
          type: "object",
          name: "product_carousel",
          title: "Product Carousel",
          fields: [
            { name: "id", type: "string", title: "ID" },
            { name: "type", type: "string", title: "Type", readOnly: true },
            { name: "variant", type: "string", title: "Variant" },
            { name: "title", type: "string", title: "Title" },
            { name: "subtitle", type: "string", title: "Subtitle" },
            { name: "snapshot", type: "image", title: "Snapshot", description: "Admin-captured thumbnail for the overview grid" },
            {
              name: "filter",
              type: "object",
              title: "Filter",
              fields: [
                { name: "category", type: "string", title: "Category" },
                { name: "brand", type: "string", title: "Brand" },
                { name: "name", type: "string", title: "Name" },
                { name: "traction", type: "string", title: "Traction" },
                { name: "min_price", type: "number", title: "Min Price" },
                { name: "max_price", type: "number", title: "Max Price" },
              ],
            },
            { name: "sort", type: "string", title: "Sort" },
            { name: "limit", type: "number", title: "Limit" },
            { name: "link", type: "string", title: "Link" },
            { name: "link_label", type: "string", title: "Link Label" },
          ],
          preview: { select: { title: "title" } },
        },
        {
          type: "object",
          name: "category_carousel",
          title: "Category Carousel",
          fields: [
            { name: "id", type: "string", title: "ID" },
            { name: "type", type: "string", title: "Type", readOnly: true },
            { name: "variant", type: "string", title: "Variant" },
            { name: "title", type: "string", title: "Title" },
            { name: "snapshot", type: "image", title: "Snapshot", description: "Admin-captured thumbnail for the overview grid" },
            { name: "autoSwitchMs", type: "number", title: "Auto Switch (ms)" },
            {
              name: "cards",
              type: "array",
              title: "Cards",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "id", type: "string", title: "ID" },
                    { name: "title", type: "string", title: "Title" },
                    { name: "subtitle", type: "string", title: "Subtitle" },
                    { name: "link", type: "string", title: "Link" },
                    { name: "image", type: "image", title: "Card Image" },
                    { name: "gradient", type: "string", title: "Gradient" },
                    { name: "emoji", type: "string", title: "Emoji" },
                  ],
                  preview: { select: { title: "title" } },
                },
              ],
            },
          ],
          preview: { select: { title: "title" } },
        },
      ],
    }),
  ],
})
