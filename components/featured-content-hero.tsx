import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { getImageUrl, formatDate } from "@/lib/utils"
import type { ContentItem } from "@/lib/combined-content"
import { ArrowRight, Calendar, User, BookOpen, Wrench } from "lucide-react"

interface FeaturedContentHeroProps {
  items: ContentItem[]
}

export function FeaturedContentHero({ items }: FeaturedContentHeroProps) {
  if (items.length === 0) return null

  const primaryFeatured = items[0]
  const secondaryFeatured = items.slice(1, 3)

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-12 md:py-16">
      <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] opacity-30" />
      <div className="relative max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Featured Content
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Discover our latest insights, tools, and resources for AI-powered events
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary Featured Item */}
          <div className="lg:col-span-2">
            <FeaturedContentCard item={primaryFeatured} size="large" />
          </div>

          {/* Secondary Featured Items */}
          <div className="space-y-6">
            {secondaryFeatured.map((item) => (
              <FeaturedContentCard key={item.id} item={item} size="small" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface FeaturedContentCardProps {
  item: ContentItem
  size: "large" | "small"
}

function FeaturedContentCard({ item, size }: FeaturedContentCardProps) {
  const featuredImageUrl = item.featuredImage?.url ? getImageUrl(item.featuredImage.url) : null
  const linkHref = item.type === 'blog' ? `/blog/${item.slug}` : `/lp/${item.slug}`
  
  const isLarge = size === "large"
  const cardClasses = isLarge 
    ? "group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100"
    : "group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"

  return (
    <article className={cardClasses}>
      {/* Featured Image */}
      {featuredImageUrl && (
        <div className={`relative overflow-hidden ${isLarge ? 'h-48 md:h-64' : 'h-28'}`}>
          <Link href={linkHref} className="block w-full h-full">
            <Image
              src={featuredImageUrl}
              alt={item.featuredImage?.alt || item.title}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              priority={isLarge}
              sizes={isLarge ? "(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </Link>
          
          {/* Floating Badge */}
          <div className="absolute top-4 left-4">
            <Badge 
              variant="secondary"
              className={`${
                item.type === 'blog' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              } ${isLarge ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'} shadow-lg`}
            >
              {item.type === 'blog' ? (
                <><BookOpen className="w-3 h-3 mr-1" /> Article</>
              ) : (
                <><Wrench className="w-3 h-3 mr-1" /> Tool</>
              )}
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`p-${isLarge ? '6' : '4'}`}>
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-3">
          {item.categories.slice(0, isLarge ? 3 : 2).map((category) => (
            <Badge key={category.slug} variant="outline" className="text-xs text-gray-600 border-gray-300">
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h3 className={`font-bold text-gray-900 mb-3 leading-tight ${
          isLarge ? 'text-2xl md:text-3xl' : 'text-lg'
        }`}>
          <Link 
            href={linkHref} 
            className="hover:text-blue-600 transition-colors duration-200"
          >
            {item.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className={`text-gray-600 mb-4 leading-relaxed ${
          isLarge ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'
        }`}>
          {item.excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            {item.author?.name && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{item.author.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <time dateTime={item.publishedDate}>
                {formatDate(item.publishedDate)}
              </time>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link 
          href={linkHref}
          className={`inline-flex items-center gap-2 font-semibold transition-all duration-200 group/cta ${
            item.type === 'blog'
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-emerald-600 hover:text-emerald-700'
          } ${isLarge ? 'text-base' : 'text-sm'}`}
        >
          {item.type === 'blog' ? 'Read article' : 'Try tool'}
          <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  )
}