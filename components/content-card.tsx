import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { getImageUrl, formatDate } from "@/lib/utils"
import type { ContentItem } from "@/lib/combined-content"
import { ArrowUpRight, Calendar, User, BookOpen, Wrench, ExternalLink } from "lucide-react"

interface ContentCardProps {
  item: ContentItem
}

export function ContentCard({ item }: ContentCardProps) {
  const featuredImageUrl = item.featuredImage?.url ? getImageUrl(item.featuredImage.url) : null
  const linkHref = item.type === 'blog' ? `/blog/${item.slug}` : `/lp/${item.slug}`

  return (
    <article className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1">
      {/* Featured Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {featuredImageUrl ? (
          <Link href={linkHref} className="block w-full h-full">
            <Image
              src={featuredImageUrl}
              alt={item.featuredImage?.alt || item.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        ) : (
          <Link href={linkHref} className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100">
            {item.type === 'blog' ? (
              <BookOpen className="w-12 h-12 text-blue-400" />
            ) : (
              <Wrench className="w-12 h-12 text-emerald-400" />
            )}
          </Link>
        )}
        
        {/* Floating Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            className={`${
              item.type === 'blog' 
                ? 'bg-blue-600/90 text-white hover:bg-blue-700' 
                : 'bg-emerald-600/90 text-white hover:bg-emerald-700'
            } backdrop-blur-sm shadow-lg border-0`}
          >
            {item.type === 'blog' ? (
              <><BookOpen className="w-3 h-3 mr-1" /> Article</>
            ) : (
              <><Wrench className="w-3 h-3 mr-1" /> Tool</>
            )}
          </Badge>
        </div>

        {/* Hover Action */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.categories.slice(0, 2).map((category) => (
            <Badge 
              key={category.slug} 
              variant="outline" 
              className="text-xs font-medium border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-200">
          <Link href={linkHref}>
            {item.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed">
          {item.excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
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

        {/* CTA */}
        <Link 
          href={linkHref}
          className={`inline-flex items-center gap-2 font-semibold text-sm transition-all duration-200 group/cta ${
            item.type === 'blog'
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-emerald-600 hover:text-emerald-700'
          }`}
        >
          {item.type === 'blog' ? 'Read article' : 'Try tool'}
          <ArrowUpRight className="w-4 h-4 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Subtle border accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${
        item.type === 'blog' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
      } transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </article>
  )
}