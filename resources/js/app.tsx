import { createInertiaApp } from '@inertiajs/react';
import '@fontsource-variable/league-spartan';

import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import IntroductionLayout from './layouts/IntroductionLayout';

const applicationName = import.meta.env.VITE_APP_NAME || 'Achelife';

createInertiaApp({
    title: (title) => (title ? `${title} - ${applicationName}` : applicationName),
    defaults: {
        visitOptions: (_href, options) => ({
            ...options,
            headers: {
                ...options.headers,
                'X-Achelife-Current-Url': `${window.location.pathname}${window.location.search}`,
            },
        }),
    },
    layout: (pageName) => {
        if (pageName.startsWith('setup/')) return AuthLayout;
        if (pageName === 'seasons/Introduction' || pageName.startsWith('onboarding/')) return IntroductionLayout;

        return AppLayout;
    },
    strictMode: true,
    progress: {
        color: '#d7e66b',
    },
});
