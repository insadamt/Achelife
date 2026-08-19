import type { DiaryContentNode, DiaryDay, DiaryDayState } from './types';

export function formatDiaryDate(date: string, options?: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(undefined, options ?? { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export function contentToPlainText(nodes: DiaryContentNode[]) {
    return nodes.map((node) => (node.type === 'text' ? node.text : `@${node.label}`)).join('');
}

export function restoreMentionBoundarySpacing(nodes: DiaryContentNode[]) {
    return nodes.map((node, index): DiaryContentNode => {
        if (node.type !== 'text') return node;

        const previousNode = nodes[index - 1];
        const nextNode = nodes[index + 1];
        const needsLeadingSpace = previousNode?.type === 'mention' && /^[\p{L}\p{N}]/u.test(node.text);
        const needsTrailingSpace = nextNode?.type === 'mention' && /[\p{L}\p{N}]$/u.test(node.text);

        return {
            ...node,
            text: `${needsLeadingSpace ? ' ' : ''}${node.text}${needsTrailingSpace ? ' ' : ''}`,
        };
    });
}

export function stateClassName(state: DiaryDayState) {
    return {
        completed: 'border-success/70 bg-success/18 text-success',
        missed: 'border-border-strong bg-elevated text-secondary',
        pending: 'border-warning/70 bg-warning/16 text-warning',
        unavailable: 'border-transparent bg-transparent text-muted/50',
    }[state];
}

export function diaryDayLabel(day: DiaryDay, today: string) {
    if (day.state === 'completed') return 'Complete';
    if (day.characterCount > 0 || day.updatedAt) return 'Draft';
    if (day.state === 'unavailable') return 'Unavailable';
    if (day.locked) return 'No entry';
    if (day.date === today) return 'Ready to write';

    return 'Unwritten';
}

export function diaryDayLabelClassName(day: DiaryDay) {
    if (day.state === 'completed') return 'text-success';
    if (day.characterCount > 0 || day.updatedAt) return 'text-warning';

    return 'text-muted';
}

export function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
