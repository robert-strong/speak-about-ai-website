"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Client {
  name: string
  src: string
  alt: string
  size: "small" | "default" | "extra-large" | "super-large"
}

interface ClientLogosCarouselProps {
  title: string
  subtitle: string
  clients: Client[]
  ctaText: string
  ctaLink: string
}

export default function ClientLogosCarousel({
  title,
  subtitle,
  clients,
  ctaText,
  ctaLink,
}: ClientLogosCarouselProps) {
  // Duplicate clients for a seamless looping effect
  const allClients = [...clients, ...clients]

  return (
    <section className="pt-4 pb-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-3">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>
      </div>
      <TooltipProvider>
        <div className="relative w-full overflow-hidden py-1">
          <div className="flex animate-marquee-mobile md:animate-marquee-fast gap-x-16">
            {allClients.map((client, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="flex-shrink-0 flex items-center justify-center py-2 cursor-pointer">
                    <Image
                      src={client.src}
                      alt={client.alt}
                      width={
                        client.size === "super-large"
                          ? 800
                          : client.size === "extra-large"
                            ? 500
                            : client.size === "small"
                              ? 250
                              : 400
                      }
                      height={
                        client.size === "super-large"
                          ? 400
                          : client.size === "extra-large"
                            ? 250
                            : client.size === "small"
                              ? 120
                              : 200
                      }
                      className={`w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300 ${
                        client.size === "super-large"
                          ? "h-64"
                          : client.size === "extra-large"
                            ? "h-40"
                            : client.size === "small"
                              ? "h-24"
                              : "h-32"
                      }`}
                      loading="lazy"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{client.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* View Past Clients & Events Link */}
      <div className="text-center mt-8 pb-4">
        <Button asChild variant="gold" size="lg" className="font-montserrat font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <Link href={ctaLink} className="flex items-center">
            {ctaText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
