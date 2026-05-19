'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!contentRef.current) return;

    // Get all heading elements from the content
    const elements = Array.from(contentRef.current.querySelectorAll('h2, h3'));
    
    // Create an array of heading data
    const headingData = elements.map((element, index) => {
      // Ensure element has an ID
      if (!element.id) {
        // Generate a simple ID based on text or index if it doesn't have one
        const text = element.textContent || '';
        const generatedId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `heading-${index}`;
        element.id = generatedId;
      }
      
      return {
        id: element.id,
        text: element.textContent || '',
        level: Number(element.tagName.charAt(1)), // 2 or 3
      };
    });

    setHeadings(headingData);

    // Setup Intersection Observer to track which section is currently visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    elements.forEach((elem) => observer.observe(elem));

    return () => observer.disconnect();
  }, [contentRef]);

  if (headings.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold pb-3 border-b border-gray-200">
        <List className="h-5 w-5 text-primary" />
        <h3 className="text-base tracking-tight">Nội dung chính</h3>
      </div>
      <nav className="flex flex-col gap-2.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => handleClick(e, heading.id)}
            className={`text-sm font-medium transition-colors line-clamp-2 ${
              heading.level === 3 ? 'ml-4' : ''
            } ${
              activeId === heading.id
                ? 'text-primary font-bold'
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
