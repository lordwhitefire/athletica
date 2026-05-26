import { getAmazonLinksDoc } from "@/lib/actions/amazon-links";
import AmazonLinksEditor from "@/components/admin/AmazonLinksEditor";

export default async function AdminAmazonLinksPage() {
    const doc = await getAmazonLinksDoc();
    return <AmazonLinksEditor doc={doc} />;
}
