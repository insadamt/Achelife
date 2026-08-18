import { createInertiaApp } from '@inertiajs/react';
import '@fontsource-variable/league-spartan';

import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

const applicationName = import.meta.env.VITE_APP_NAME || 'Achelife';

createInertiaApp({
    title: (title) => (title ? `${title} - ${applicationName}` : applicationName),
    layout: (pageName) => (pageName.startsWith('auth/') ? AuthLayout : AppLayout),
    strictMode: true,
    progress: {
        color: '#9bb3ff',
    },
});
