import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from "@clerk/themes";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const FRONTEND_API = import.meta.env.VITE_CLERK_FRONTEND_API;

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <ClerkProvider
        appearance={{
            baseTheme: dark,
        }}
        frontendApi={FRONTEND_API}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/TalentBliss/"
    >
        <App />
    </ClerkProvider>
)