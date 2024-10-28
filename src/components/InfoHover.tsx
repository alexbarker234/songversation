import { useClickOutside } from "@/hooks/clickOutside";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";

export default function FieldInfoHover({ content }: { content: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeout = useRef<number | undefined>(undefined);
  const leaveTimeout = useRef<number | undefined>(undefined);
  // Handle overflow on screen
  const [tooltipStyles, setTooltipStyles] = useState<CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    // Clear the leave timeout if the user hovers back in before it expires
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = undefined;
    }

    hoverTimeout.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    // Clear the show timeout in case the mouse leaves before the tooltip is shown
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = undefined;
    }

    leaveTimeout.current = window.setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  useEffect(() => {
    if (showTooltip && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Calculate overflow and adjust tooltip position
      let newStyles: CSSProperties = {};

      if (tooltipRect.right > viewportWidth) {
        newStyles.left = `${viewportWidth - tooltipRect.width - tooltipRect.left}px`;
      } else if (tooltipRect.left < 0) {
        newStyles.left = `${-tooltipRect.left}px`;
      }

      setTooltipStyles(newStyles);
    }
  }, [showTooltip]);

  const handleClick = () => {
    setShowTooltip(true);
  };

  useClickOutside([tooltipRef], handleMouseLeave, showTooltip);

  return (
    <div
      className="relative cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <FaInfoCircle className="ml-2" />
      {/* This won't resize to its text for some reason */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          style={tooltipStyles}
          className="absolute left-0 top-full z-10 mt-1 w-80 min-w-fit cursor-auto whitespace-break-spaces rounded bg-grey-light p-2 text-sm text-white shadow-lg"
        >
          {content}
        </div>
      )}
    </div>
  );
}
