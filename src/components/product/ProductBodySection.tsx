import { getProductBody } from "@/lib/graphql";
import ProductContentMatrix from "./ProductContentMatrix";
import ProductDescriptionSections from "./ProductDescriptionSections";

export default async function ProductBodySection({ slug }: { slug: string }) {
  const body = await getProductBody(slug);
  if (!body) return null;

  const matrix = body.contentMatrix;
  const hasMatrix = Boolean(matrix && matrix.columns.length > 0 && matrix.items.length > 0);
  const hasGallery = (body.secondaryGallery?.length ?? 0) > 0;
  const hasDescription = Boolean(body.description);

  if (!hasMatrix && !hasGallery && !hasDescription) return null;

  return (
    <div className="flex flex-col gap-12">
      {hasMatrix && (
        <div className="cv-auto">
          <ProductContentMatrix contentMatrix={matrix} />
        </div>
      )}
      {(hasGallery || hasDescription) && (
        <div className="cv-auto flex flex-col gap-12">
          <ProductDescriptionSections
            secondaryGallery={body.secondaryGallery}
            description={body.description}
          />
        </div>
      )}
    </div>
  );
}