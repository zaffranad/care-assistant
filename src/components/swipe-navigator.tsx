"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const ROUTES = ["/", "/reporting", "/settings"] as const;
const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_VERTICAL_RATIO = 0.6;

export function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

      touchStartX.current = null;
      touchStartY.current = null;

      // Si le mouvement vertical est dominant, c'est un scroll — on ignore
      if (deltaY > Math.abs(deltaX) * SWIPE_MAX_VERTICAL_RATIO) return;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

      const currentIndex = ROUTES.indexOf(pathname as (typeof ROUTES)[number]);
      if (currentIndex === -1) return;

      if (deltaX < 0 && currentIndex < ROUTES.length - 1) {
        router.push(ROUTES[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        router.push(ROUTES[currentIndex - 1]);
      }
    },
    [pathname, router]
  );

  const currentIndex = ROUTES.indexOf(pathname as (typeof ROUTES)[number]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col min-h-[calc(100vh-4rem)]"
    >
      <div className="flex-1">{children}</div>

      {/* Indicateurs de pagination — visibles uniquement sur mobile */}
      {currentIndex !== -1 && (
        <div className="flex sm:hidden justify-center items-center gap-2 py-4 pb-safe">
          {ROUTES.map((route, index) => (
            <button
              key={route}
              onClick={() => router.push(route)}
              aria-label={`Aller à la page ${index + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-5 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
