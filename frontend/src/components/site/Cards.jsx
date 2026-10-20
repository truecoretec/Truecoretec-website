import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEnquiryModal } from "@/components/site/EnquiryModal";

export const ProductCard = ({ product }) => {
  const { openEnquiry } = useEnquiryModal();
  return (
  <article className="tc-card group flex flex-col" data-testid={`product-card-${product.slug}`}>
    <div className="aspect-[4/3] w-full overflow-hidden bg-[#EDEDED]">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width="640"
          height="480"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="tc-eyebrow">Image pending approval</span>
        </div>
      )}
    </div>
    <div className="flex flex-1 flex-col p-5 lg:p-6">
      {product.category?.name && <p className="tc-eyebrow">{product.category.name}</p>}
      <h3 className="mt-2 text-lg font-semibold">{product.name}</h3>
      {product.product_code && (
        <p className="tc-mono mt-1 text-xs text-[#8A8F96]">CODE: {product.product_code}</p>
      )}
      {product.summary && <p className="mt-3 text-[15px] text-[#3F434A]">{product.summary}</p>}
      {product.specifications?.length > 0 && (
        <ul className="mt-4 space-y-1 text-[13px] text-[#3F434A]">
          {product.specifications.slice(0, 3).map((s) => (
            <li key={s.label} className="flex justify-between gap-3 border-b border-[#EDEDED] pb-1">
              <span className="text-[#8A8F96]">{s.label}</span>
              <span className="tc-mono">{s.value}{s.unit ? ` ${s.unit}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4 pt-1">
        <Link
          to={`/products/${product.slug}`}
          className="tc-btn-ghost text-[13px]"
          data-testid={`view-product-${product.slug}`}
        >
          View Details <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => openEnquiry({ title: `Request a Quote — ${product.name}`, productSlug: product.slug })}
          className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#10A6D8] hover:text-[#003B7A]"
          data-testid={`quote-product-${product.slug}`}
        >
          Request a Quote
        </button>
      </div>
    </div>
  </article>
  );
};

export const SimpleCard = ({ to, eyebrow, title, text, image, testId }) => (
  <Link to={to} className="tc-card group flex flex-col" data-testid={testId}>
    {image && (
      <div className="aspect-[16/9] overflow-hidden bg-[#EDEDED]">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    )}
    <div className="flex flex-1 flex-col p-6">
      {eyebrow && <p className="tc-eyebrow">{eyebrow}</p>}
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      {text && <p className="mt-3 text-[15px] text-[#3F434A]">{text}</p>}
      <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#10A6D8]">
        Explore <ArrowRight size={15} aria-hidden="true" />
      </span>
    </div>
  </Link>
);
