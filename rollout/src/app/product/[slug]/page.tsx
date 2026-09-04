import { getProductBySlug } from '@/lib/products/product-service';
import { recordView } from '@/lib/analytics/analytics-service';
import ProductDetailsClient from './ProductDetailsClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Record view (fire and forget)
  recordView(product.id).catch(console.error);

  return <ProductDetailsClient product={product} />;
}
