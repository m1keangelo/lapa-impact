/**
 * useHeroImages — the rotating homepage hero backgrounds.
 *
 * Firestore `settings/hero` holds { images: string[] } (Cloudinary URLs,
 * managed in Admin → Portada). Everyone can read it; only admins write
 * (firestore.rules settings/{id}). When the doc is missing or the list is
 * empty, the hero falls back to the bundled default photo — the page is
 * never empty and never broken.
 */
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface HeroImagesState {
  /** Remote slideshow images, in rotation order. Empty = default photo. */
  images: string[];
  loading: boolean;
}

export function useHeroImages(): HeroImagesState {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'settings', 'hero'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { images?: unknown };
          setImages(
            Array.isArray(data.images)
              ? data.images.filter((x): x is string => typeof x === 'string' && x.length > 0)
              : [],
          );
        } else {
          setImages([]);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useHeroImages] listener failed:', err);
        setImages([]);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { images, loading };
}
