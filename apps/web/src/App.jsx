import { lazy, Suspense } from "react";
import { Route, Router, Switch } from "wouter";
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { CompaniesProvider } from "@/hooks/companies-context.jsx";
import { BarLoader } from "react-spinners";

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

const themeFromStorage = localStorage.getItem("vite-ui-theme");
const initialTheme = themeFromStorage || "light";
const fallback = <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function protectedPage(Component) {
  return (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme">
      <CompaniesProvider>
        <Router base={basePath || undefined}>
          <Suspense fallback={fallback}>
            <AppLayout>
              <Switch>
                <Route path="/" component={Landing} />
                <Route path="/onboarding">{protectedPage(Onboarding)}</Route>
                <Route path="/jobs" component={JobListing} />
                <Route path="/job/:id" component={Job} />
                <Route path="/post-job">{protectedPage(PostJob)}</Route>
                <Route path="/saved-jobs">{protectedPage(SavedJobs)}</Route>
                <Route path="/my-jobs">{protectedPage(MyJobs)}</Route>
                <Route component={NotFound} />
              </Switch>
            </AppLayout>
          </Suspense>
        </Router>
      </CompaniesProvider>
    </ThemeProvider>
  );
}

export default App;
