import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy } from "react";
import './App.css';
import { ThemeProvider } from "./components/theme-provider";
import { CompaniesProvider } from "@/hooks/companies-context.jsx";

// Lazy load components
const AppLayout = lazy(() => import("./layouts/app-layout"));
const Landing = lazy(() => import("./pages/landing"));
const Onboarding = lazy(() => import("./pages/onboarding"));
const JobListing = lazy(() => import("@/pages/job-listing"));
const Job = lazy(() => import("@/pages/job"));
const PostJob = lazy(() => import("@/pages/post-job"));
const SavedJobs = lazy(() => import("@/pages/saved-jobs"));
const MyJobs = lazy(() => import("@/pages/my-jobs"));
const ProtectedRoute = lazy(() => import("./components/protected-routes"));

// Initialize theme from localStorage or fallback to default value
const themeFromStorage = localStorage.getItem("vite-ui-theme");
const initialTheme = themeFromStorage || "light";

// Create router
const router = createBrowserRouter([
    {
        element: (
            <Suspense fallback={null}>
                <AppLayout />
            </Suspense>
        ),
        children: [
            {
                path: '/TalentBliss',
                element: (
                    <Suspense fallback={null}>
                        <Landing />
                    </Suspense>
                )
            },
            {
                path: '/TalentBliss/onboarding',
                element: (
                    <Suspense fallback={null}>
                        <ProtectedRoute>
                            <Onboarding />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/TalentBliss/jobs',
                element: (
                    <Suspense fallback={null}>
                        <ProtectedRoute>
                            <JobListing />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/TalentBliss/job/:id',
                element: (
                    <Suspense fallback={null}>
                        <ProtectedRoute>
                            <Job />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/TalentBliss/post-job',
                element: (
                    <Suspense fallback={null}>
                        <ProtectedRoute>
                            <PostJob />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/TalentBliss/saved-jobs',
                element: (
                    <Suspense fallback={null}>
                        <ProtectedRoute>
                            <SavedJobs />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/TalentBliss/my-jobs',
                element: (
                    <Suspense fallback={null}>
                        <ProtectedRoute>
                            <MyJobs />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
        ]
    }
]);

function App() {
    return (
        <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme">
            <CompaniesProvider>
                <RouterProvider router={router} />
            </CompaniesProvider>
        </ThemeProvider>
    );
}

export default App;
