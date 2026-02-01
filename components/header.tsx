"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-gray-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/speak-about-ai-dark-logo.png"
              alt="Speak About AI"
              width={240}
              height={60}
              priority
              className="h-14 w-auto object-contain flex-shrink-0"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            <Link href="/" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#ffffff' }}>
              Home
            </Link>
            <Link href="/speakers" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#ffffff' }}>
              Speakers
            </Link>
            <Link href="/ai-workshops" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#ffffff' }}>
              AI Workshops
            </Link>
            <Link href="/our-services" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#ffffff' }}>
              Services
            </Link>
            <Link href="/our-team" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#ffffff' }}>
              About Us
            </Link>
            <Link href="/blog" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#ffffff' }}>
              Resources
            </Link>
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 xl:space-x-4 flex-shrink-0">
            <Button
              asChild
              variant="gold"
              size="sm"
              className="font-montserrat font-bold text-xs lg:text-sm whitespace-nowrap"
            >
              <Link href="/contact">Book Speaker Today</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="font-semibold hover:opacity-80"
                style={{ color: '#ffffff' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/speakers"
                className="font-semibold hover:opacity-80"
                style={{ color: '#ffffff' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Speakers
              </Link>
              <Link
                href="/ai-workshops"
                className="font-semibold hover:opacity-80"
                style={{ color: '#ffffff' }}
                onClick={() => setIsMenuOpen(false)}
              >
                AI Workshops
              </Link>
              <Link
                href="/our-services"
                className="font-semibold hover:opacity-80"
                style={{ color: '#ffffff' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/our-team"
                className="font-semibold hover:opacity-80"
                style={{ color: '#ffffff' }}
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/blog"
                className="font-semibold hover:opacity-80"
                style={{ color: '#ffffff' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Resources
              </Link>
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <Button
                  asChild
                  variant="gold"
                  size="default"
                  className="font-montserrat font-bold w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/contact">Book Speaker Today</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
