import { useLayoutEffect, useRef } from 'react';

type ChartTooltipCardProps = {
    chartWidth: number;
    chartHeight: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    value: string;
    detail?: string;
};

function copyChartArtworkIntoTooltip(artworkElement: HTMLDivElement, x: number, y: number, width: number, height: number, chartWidth: number, chartHeight: number) {
    const chartElement = artworkElement.parentElement?.previousElementSibling;

    if (!(chartElement instanceof SVGSVGElement)) return;

    const chartArtwork = chartElement.cloneNode(true) as SVGSVGElement;
    chartArtwork.removeAttribute('aria-label');
    chartArtwork.removeAttribute('role');
    chartArtwork.setAttribute('aria-hidden', 'true');
    chartArtwork.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    chartArtwork.querySelectorAll('[tabindex]').forEach((element) => element.removeAttribute('tabindex'));
    chartArtwork.style.position = 'absolute';
    chartArtwork.style.left = `${-x / width * 100}%`;
    chartArtwork.style.top = `${-y / height * 100}%`;
    chartArtwork.style.width = `${chartWidth / width * 100}%`;
    chartArtwork.style.height = `${chartHeight / height * 100}%`;
    artworkElement.replaceChildren(chartArtwork);
}

export function ChartTooltipCard({ chartWidth, chartHeight, x, y, width, height, label, value, detail }: ChartTooltipCardProps) {
    const artworkRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const artworkElement = artworkRef.current;

        if (!artworkElement) return;

        copyChartArtworkIntoTooltip(artworkElement, x, y, width, height, chartWidth, chartHeight);

        return () => artworkElement.replaceChildren();
    }, [chartWidth, chartHeight, x, y, width, height, label, value, detail]);

    return (
        <div
            aria-hidden="true"
            className="chart-tooltip-card"
            style={{
                left: `${x / chartWidth * 100}%`,
                top: `${y / chartHeight * 100}%`,
                width: `${width / chartWidth * 100}%`,
                height: `${height / chartHeight * 100}%`,
            }}
        >
            <div className="chart-tooltip-artwork" ref={artworkRef} />
            <span className="chart-tooltip-label">{label}</span>
            <strong className="chart-tooltip-value">{value}</strong>
            {detail && <span className="chart-tooltip-detail">{detail}</span>}
        </div>
    );
}
