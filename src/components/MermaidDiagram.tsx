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
    fontSize: "13px",
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
    padding: 16,
    nodeSpacing: 30,
    rankSpacing: 40,
  },
});

const MermaidDiagram = ({ chart, id }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(renderedSvg);
      } catch (error) {
        console.error("Mermaid render error:", error);
      }
    };
    renderDiagram();
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto rounded-lg bg-secondary/30 border border-border p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
