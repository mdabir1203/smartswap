import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#f97316",
    primaryTextColor: "#fff",
    primaryBorderColor: "#f97316",
    lineColor: "#6b7280",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "14px",
    nodeBorder: "#f97316",
    mainBkg: "#1e293b",
    clusterBkg: "#0f172a",
    clusterBorder: "#334155",
    titleColor: "#f8fafc",
    edgeLabelBackground: "#0f172a",
    nodeTextColor: "#f8fafc",
  },
  flowchart: {
    htmlLabels: true,
    curve: "basis",
    padding: 20,
    nodeSpacing: 35,
    rankSpacing: 50,
    useMaxWidth: false,
  },
});

/**
 * Post-process the Mermaid SVG to ensure it scales responsively.
 * Mermaid outputs SVGs with fixed pixel dimensions — we need to
 * override those so the diagram fills its container.
 */
function makeResponsive(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) return svgString;

  // Preserve the original viewBox (or build one from width/height)
  if (!svg.getAttribute("viewBox")) {
    const w = parseFloat(svg.getAttribute("width") || "800");
    const h = parseFloat(svg.getAttribute("height") || "600");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }

  // Keep the original width as max-width so the diagram doesn't stretch
  // beyond its natural size, but allow it to shrink on smaller screens
  const originalWidth = parseFloat(svg.getAttribute("width") || "800");
  const maxW = Math.min(originalWidth, 960);

  svg.setAttribute("width", "100%");
  svg.removeAttribute("height");
  svg.style.maxWidth = `${maxW}px`;
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.margin = "0 auto";

  return new XMLSerializer().serializeToString(svg);
}

const MermaidDiagram = ({ chart, id }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(makeResponsive(renderedSvg));
      } catch (error) {
        console.error("Mermaid render error:", error);
      }
    };
    renderDiagram();
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto rounded-lg bg-secondary/30 border border-border p-4 md:p-6 flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
