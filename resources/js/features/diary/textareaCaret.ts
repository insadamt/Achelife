interface CaretCoordinates {
    left: number;
    top: number;
    lineHeight: number;
}

const mirroredProperties = [
    'borderLeftWidth',
    'borderTopWidth',
    'boxSizing',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'textAlign',
    'textIndent',
    'textTransform',
    'wordSpacing',
] as const;

export function getTextareaCaretCoordinates(textarea: HTMLTextAreaElement, position: number): CaretCoordinates {
    const computedStyle = window.getComputedStyle(textarea);
    const mirror = document.createElement('div');
    const marker = document.createElement('span');

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.direction = computedStyle.direction;

    mirroredProperties.forEach((property) => {
        mirror.style[property] = computedStyle[property];
    });

    mirror.textContent = textarea.value.slice(0, position);
    marker.textContent = '\u200b';
    mirror.append(marker);
    document.body.append(mirror);

    const mirrorRectangle = mirror.getBoundingClientRect();
    const markerRectangle = marker.getBoundingClientRect();
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || Number.parseFloat(computedStyle.fontSize) * 1.9;
    const coordinates = {
        left: markerRectangle.left - mirrorRectangle.left,
        top: markerRectangle.top - mirrorRectangle.top,
        lineHeight,
    };

    mirror.remove();

    return coordinates;
}
