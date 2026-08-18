import type { DiaryContentNode, DiaryDayState } from './types';

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
        missed: 'border-danger/65 bg-danger/14 text-danger',
        pending: 'border-warning/70 bg-warning/16 text-warning',
        unavailable: 'border-transparent bg-transparent text-muted/50',
    }[state];
}

export function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
