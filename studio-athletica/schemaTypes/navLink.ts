import { defineType } from "sanity"

export default defineType({
  name: "navLink",
  title: "Nav Link",
  type: "object",
  fields: [
    { name: "label", type: "string", title: "Label" },
    { name: "href", type: "string", title: "Href" },
    { name: "description", type: "text", title: "Description", rows: 2 },
  ],
  preview: {
    select: { title: "label", subtitle: "href" },
  },
})
