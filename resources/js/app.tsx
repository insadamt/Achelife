import { createInertiaApp } from '@inertiajs/react';
import '@fontsource-variable/league-spartan';

import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import IntroductionLayout from './layouts/IntroductionLayout';

const applicationName = import.meta.env.VITE_APP_NAME || 'Achelife';

createInertiaApp({
    title: (title) => (title ? `${title} - ${applicationName}` : applicationName),
    layout: (pageName) => {
        if (pageName.startsWith('auth/')) return AuthLayout;
        if (pageName === 'seasons/Introduction') return IntroductionLayout;

        return AppLayout;
    },
    strictMode: true,
    progress: {
        color: '#9bb3ff',
    },
});
