import { FolderKanban } from 'lucide-react';
import { useState } from 'react';

import { Surface } from '../../components/ui';
import { formatFocusDuration } from './taskStatisticsPresentation';
import type { TaskFocusStatisticsData } from './taskStatisticsTypes';

const inboxColor = 'var(--task-accent)';
const donutRadius = 72;
const donutCenter = 110;
const arcSeamOverlapDegrees = 0.35;

interface ProjectFocusSlice {
    color: string;
    key: string;
    name: string;
    percentage: number;
    seconds: number;
}

export function TaskFocusProjectDonut({ focus }: { focus: TaskFocusStatisticsData }) {
    const slices = projectFocusSlices(focus);
    const [activeKey, setActiveKey] = useState<string | null>(null);

    return <Surface className="min-w-0 rounded-3xl p-4 sm:p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold"><FolderKanban aria-hidden="true" className="text-accent-ink" size={18} />Focus by Project</h3>
        <p className="mt-1 text-sm text-muted">Hover a segment to see its Project and completed Focus Time.</p>
        {slices.length === 0 ? <p className="mt-5 grid min-h-40 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 px-5 text-center text-sm text-muted">No Project Focus in this period.</p> : <div className="mt-5">
            <ProjectDonut activeKey={activeKey} onActiveKeyChange={setActiveKey} slices={slices} totalSeconds={focus.current.totalSeconds} />
            <ul aria-label="Focus Time by Project" className="mt-6 grid gap-x-8 gap-y-3 border-t border-border-subtle pt-5 sm:grid-cols-2 xl:grid-cols-3">{slices.map((slice) => <li className="flex items-center justify-between gap-3" key={slice.key}>
                <span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} /><span className="truncate text-sm font-semibold">{slice.name}</span></span>
                <span className="shrink-0 text-right text-xs font-bold tabular-nums"><span>{formatFocusDuration(slice.seconds)}</span><span className="ml-2 text-muted">{formatPercentage(slice.percentage)}</span></span>
            </li>)}</ul>
        </div>}
    </Surface>;
}

function ProjectDonut({ activeKey, onActiveKeyChange, slices, totalSeconds }: { activeKey: string | null; onActiveKeyChange: (key: string | null) => void; slices: ProjectFocusSlice[]; totalSeconds: number }) {
    const arcs = donutArcs(slices);
    const activeSlice = slices.find((slice) => slice.key === activeKey) ?? null;

    return <div className="relative mx-auto size-72 sm:size-80" aria-label={`Project Focus distribution: ${slices.map((slice) => `${slice.name} ${formatPercentage(slice.percentage)}`).join(', ')}`}>
        <svg className="size-full overflow-visible" viewBox="0 0 220 220">
            <circle cx={donutCenter} cy={donutCenter} fill="none" r={donutRadius} stroke="var(--border-subtle)" strokeWidth="24" />
            {arcs.map((arc) => <path className="cursor-pointer outline-none transition-[stroke-width,opacity,filter] duration-200 ease-out focus-visible:[filter:drop-shadow(0_0_6px_currentColor)]" d={donutArcPath(arc)} fill="none" key={arc.slice.key} onBlur={() => onActiveKeyChange(null)} onFocus={() => onActiveKeyChange(arc.slice.key)} onPointerEnter={() => onActiveKeyChange(arc.slice.key)} onPointerLeave={() => onActiveKeyChange(null)} opacity={activeKey !== null && activeKey !== arc.slice.key ? 0.28 : 1} pointerEvents="stroke" role="button" stroke={arc.slice.color} strokeLinecap="butt" strokeWidth={activeKey === arc.slice.key ? 30 : 24} style={{ filter: activeKey === arc.slice.key ? `drop-shadow(0 0 7px ${arc.slice.color})` : undefined }} tabIndex={0} aria-label={`${arc.slice.name}: ${formatFocusDuration(arc.slice.seconds)}, ${formatPercentage(arc.slice.percentage)}`} />)}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div className="grid w-[58%] justify-items-center overflow-hidden">{activeSlice === null ? <><span className="max-w-full truncate text-3xl font-bold tabular-nums sm:text-4xl">{formatFocusDuration(totalSeconds)}</span><span className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">Focus Time</span></> : <><span className="line-clamp-2 max-w-full break-words text-lg font-bold leading-tight sm:text-xl">{activeSlice.name}</span><span className="mt-2 text-sm font-bold tabular-nums sm:text-base" style={{ color: activeSlice.color }}>{formatFocusDuration(activeSlice.seconds)} · {formatPercentage(activeSlice.percentage)}</span></>}</div></div>
    </div>;
}

interface DonutArc {
    end: number;
    slice: ProjectFocusSlice;
    start: number;
}

function donutArcs(slices: ProjectFocusSlice[]): DonutArc[] {
    let cursor = 0;

    return slices.map((slice, index) => {
        const end = index === slices.length - 1 ? 360 : cursor + slice.percentage * 3.6;
        const arc = { slice, start: cursor, end };
        cursor = end;
        return arc;
    });
}

function donutArcPath(arc: DonutArc): string {
    const span = Math.max(0, arc.end - arc.start);
    if (span <= 0.01) return '';
    if (span >= 359.99) return `M ${donutCenter} ${donutCenter - donutRadius} A ${donutRadius} ${donutRadius} 0 1 1 ${donutCenter} ${donutCenter + donutRadius} A ${donutRadius} ${donutRadius} 0 1 1 ${donutCenter} ${donutCenter - donutRadius}`;

    const start = pointOnDonut(arc.start);
    const renderedSpan = Math.min(360, span + arcSeamOverlapDegrees);
    const end = pointOnDonut(arc.start + renderedSpan);
    if (renderedSpan <= 180) return `M ${start.x} ${start.y} A ${donutRadius} ${donutRadius} 0 0 1 ${end.x} ${end.y}`;

    const midpoint = pointOnDonut(arc.start + renderedSpan / 2);
    return `M ${start.x} ${start.y} A ${donutRadius} ${donutRadius} 0 0 1 ${midpoint.x} ${midpoint.y} A ${donutRadius} ${donutRadius} 0 0 1 ${end.x} ${end.y}`;
}

function pointOnDonut(angle: number): { x: number; y: number } {
    const radians = (angle - 90) * Math.PI / 180;
    return { x: donutCenter + donutRadius * Math.cos(radians), y: donutCenter + donutRadius * Math.sin(radians) };
}

function projectFocusSlices(focus: TaskFocusStatisticsData): ProjectFocusSlice[] {
    if (focus.current.totalSeconds === 0) return [];

    return focus.projects.map((project) => ({
        color: project.color ?? inboxColor,
        key: project.id === null ? 'inbox' : String(project.id),
        name: project.name,
        percentage: project.seconds / focus.current.totalSeconds * 100,
        seconds: project.seconds,
    }));
}

function formatPercentage(percentage: number): string {
    return `${percentage.toFixed(percentage < 10 ? 1 : 0)}%`;
}
