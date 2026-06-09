import { getAmazonLinksDoc } from "@/lib/actions/amazon-links";
import AmazonLinksEditor from "@/components/admin/AmazonLinksEditor";

export default async function AdminAmazonLinksPage() {
    const result = await getAmazonLinksDoc();
    return <AmazonLinksEditor doc={result.data} />;
}
