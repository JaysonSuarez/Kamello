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
    (clientY) => {
      if (disableDrag) return;
      dragRef.current = {
        startY: clientY,
        startHeight: currentHeight,
        dragging: true,
      };
    },
    [currentHeight, disableDrag]
  );

  const handleDragMove = useCallback(
    (clientY) => {
      if (!dragRef.current.dragging || disableDrag) return;
      const dy = dragRef.current.startY - clientY;
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
    (clientY) => {
      if (!dragRef.current.dragging || disableDrag) return;
      dragRef.current.dragging = false;
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

  // Touch handlers
  const onTouchStart = (e) => handleDragStart(e.touches[0].clientY);
  const onTouchMove = (e) => handleDragMove(e.touches[0].clientY);
  const onTouchEnd = (e) => handleDragEnd(e.changedTouches[0].clientY);

  // Mouse handlers (for desktop testing)
  const onMouseDown = (e) => {
    handleDragStart(e.clientY);
    const onMove = (me) => handleDragMove(me.clientY);
    const onUp = (me) => {
      handleDragEnd(me.clientY);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet ${className}`}
      style={{ height: `${currentHeight}vh` }}
    >
      {/* Drag handle */}
      <div
        className="bottom-sheet__handle"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div className="bottom-sheet__handle-bar" />
      </div>

      {/* Sheet content */}
      <div className="bottom-sheet__content">
        {children}
      </div>
    </div>
  );
}
