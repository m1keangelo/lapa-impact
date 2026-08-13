/**
 * GalleryTile (gallery.md §3) — aspect-preserving masonry tile. The image
 * flows at its natural ratio (no cropping); a shimmering surface-2
 * skeleton sits behind it and fades out on load so the wall never pops.
 * Gift-matched photos get a sage chip top-left.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { formatRelativeTime } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GalleryTileProps {
  media: MediaItem;
  matched: boolean;
  onOpen: () => void;
}

export default function GalleryTile({ media, matched, onOpen }: GalleryTileProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={media.caption ? `Open photo: ${media.caption}` : 'Open photo'}
      className={cn(
        'group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-[12px] border border-border text-left',
        'cursor-zoom-in transition-colors duration-200 ease-calm hover:border-border-strong',
      )}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Skeleton behind the image until it loads */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 animate-pulse bg-surface-2 transition-opacity duration-500',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />
      {/* Reserve a stable box while the first paint resolves the natural ratio */}
      {!loaded ? <div aria-hidden className="aspect-[4/3] w-full" /> : null}

      <img
        src={cloudinaryUrl(media.thumbnailUrl || media.cloudinaryUrl, { width: 500, crop: 'limit' })}
        alt={media.caption || 'Field photo'}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          'relative block w-full transition-all duration-500 ease-calm',
          loaded ? 'opacity-100' : 'absolute inset-0 opacity-0',
          'group-hover:scale-[1.06] group-hover:[transition-duration:600ms]',
        )}
      />

      {/* Gift-matched chip */}
      {matched ? (
        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-sage/50 bg-bg/80 px-2 py-0.5 text-[10px] font-semibold text-sage backdrop-blur-sm">
          <Link2 className="h-2.5 w-2.5" />
          gift-matched
        </span>
      ) : null}

      {/* Bottom scrim: caption + date */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg/80 to-transparent opacity-80 transition-opacity duration-200 group-hover:opacity-100"
      />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 transition-transform duration-200 ease-calm group-hover:-translate-y-1">
        {media.caption ? (
          <span className="line-clamp-1 text-[13px] font-medium text-text">{media.caption}</span>
        ) : null}
        <span
          className="font-mono text-[11px] tracking-[0.01em] text-text-muted"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatRelativeTime(media.timestamp)}
        </span>
      </span>
    </motion.button>
  );
}
