import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import './App.css';
import { ThemeProvider } from "./components/theme-provider";
import { CompaniesProvider } from "@/hooks/companies-context.jsx";
import { BarLoader } from "react-spinners";

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
const NotFound = lazy(() => import("@/pages/not-found"));

// Initialize theme from localStorage or fallback to default value
const themeFromStorage = localStorage.getItem("vite-ui-theme");
const initialTheme = themeFromStorage || "light";

// Create router
const router = createBrowserRouter([
    {
        element: (
            <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                <AppLayout />
            </Suspense>
        ),
        children: [
            {
                path: '/',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <Landing />
                    </Suspense>
                )
            },
            {
                path: '/onboarding',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <ProtectedRoute>
                            <Onboarding />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/jobs',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <ProtectedRoute>
                            <JobListing />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/job/:id',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <ProtectedRoute>
                            <Job />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/post-job',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <ProtectedRoute>
                            <PostJob />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/saved-jobs',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <ProtectedRoute>
                            <SavedJobs />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: '/my-jobs',
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <ProtectedRoute>
                            <MyJobs />
                        </ProtectedRoute>
                    </Suspense>
                )
            },
            {
                path: "*",
                element: (
                    <Suspense fallback={<BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}>
                        <NotFound />
                    </Suspense>
                )
            }
        ]
    }
], {
    basename: "/TalentBliss"
});

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