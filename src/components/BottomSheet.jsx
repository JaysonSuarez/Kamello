import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * BottomSheet — Panel deslizable sobre el mapa.
 *
 * Props:
 *  - snapPoints: array de alturas en vh, e.g. [25, 55, 85]
 *  - initialSnap: index into snapPoints (default 1 = middle)
 *  - children: content inside the sheet
 *  - className: extra class on the sheet container
 *  - onSnapChange: callback(snapIndex)
 *  - disableDrag: if true, sheet stays at current snap
 */
export default function BottomSheet({
  snapPoints = [20, 50, 85],
  initialSnap = 1,
  children,
  className = "",
  onSnapChange,
  disableDrag = false,
}) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false });

  const currentHeight = snapPoints[currentSnap];

  // Sync if initialSnap prop changes
  useEffect(() => {
    setCurrentSnap(initialSnap);
  }, [initialSnap]);

  const findClosestSnap = useCallback(
    (heightVh) => {
      let closest = 0;
      let minDist = Math.abs(snapPoints[0] - heightVh);
      for (let i = 1; i < snapPoints.length; i++) {
        const dist = Math.abs(snapPoints[i] - heightVh);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      return closest;
    },
    [snapPoints]
  );

  const handleDragStart = useCallback(
    (e) => {
      if (disableDrag) return;
      
      // Check if touching a scrollable area that is not at the top
      const scrollable = e.target.closest('.bottom-sheet__content');
      if (scrollable && scrollable.scrollTop > 0) {
        dragRef.current.ignore = true;
        return;
      }
      
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragRef.current = {
        startY: clientY,
        startHeight: currentHeight,
        dragging: true,
        ignore: false,
      };
    },
    [currentHeight, disableDrag]
  );

  const handleDragMove = useCallback(
    (e) => {
      if (!dragRef.current.dragging || dragRef.current.ignore || disableDrag) return;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dy = dragRef.current.startY - clientY;
      
      // If pulling down and we're at the top of a scroll container, prevent default to avoid overscroll bounce
      if (dy < 0 && e.cancelable) {
        e.preventDefault();
      }

      const dvh = (dy / window.innerHeight) * 100;
      const newHeight = Math.max(
        snapPoints[0],
        Math.min(snapPoints[snapPoints.length - 1], dragRef.current.startHeight + dvh)
      );
      if (sheetRef.current) {
        sheetRef.current.style.height = `${newHeight}vh`;
        sheetRef.current.style.transition = "none";
      }
    },
    [disableDrag, snapPoints]
  );

  const handleDragEnd = useCallback(
    (e) => {
      if (!dragRef.current.dragging || dragRef.current.ignore || disableDrag) {
        dragRef.current.ignore = false;
        return;
      }
      dragRef.current.dragging = false;
      const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const dy = dragRef.current.startY - clientY;
      const dvh = (dy / window.innerHeight) * 100;
      const finalHeight = dragRef.current.startHeight + dvh;
      const newSnap = findClosestSnap(finalHeight);
      setCurrentSnap(newSnap);
      onSnapChange?.(newSnap);
      if (sheetRef.current) {
        sheetRef.current.style.transition = "";
        sheetRef.current.style.height = "";
      }
    },
    [disableDrag, findClosestSnap, onSnapChange]
  );

  // Mouse handlers (for desktop testing)
  const onMouseDown = (e) => {
    handleDragStart(e);
    const onMove = (me) => handleDragMove(me);
    const onUp = (me) => {
      handleDragEnd(me);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Prevent default touchmove on the sheet if we are actively dragging it
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    
    const onTouchMoveNative = (e) => {
      if (dragRef.current.dragging && !dragRef.current.ignore) {
        // Only prevent default if we are actually dragging the sheet (e.g. pulling down)
        // to stop the browser's pull-to-refresh or bounce.
      }
    };
    
    sheet.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    return () => sheet.removeEventListener('touchmove', onTouchMoveNative);
  }, []);

  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet ${className}`}
      style={{ height: `${currentHeight}vh` }}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={onMouseDown}
    >
      {/* Drag handle */}
      <div className="bottom-sheet__handle">
        <div className="bottom-sheet__handle-bar" />
      </div>

      {/* Sheet content */}
      <div className="bottom-sheet__content">
        {children}
      </div>
    </div>
  );
}
