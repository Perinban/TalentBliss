import { useEffect, useState } from "react";
import { BriefcaseBusiness, LogOut, PenBox } from "lucide-react";
import { useNavigate, useSearchParams } from "@/routing";
import logo from "@/assets/logo.png";
import { AuthDialog } from "@/auth/auth-dialog";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button.jsx";

const Header = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [search, setSearch] = useSearchParams();
  const { isLoaded, isSignedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (search.get("sign-in")) setShowAuth(true);
  }, [search]);

  const closeAuth = (open) => {
    setShowAuth(open);
    if (!open && search.get("sign-in")) setSearch({}, { replace: true });
  };

  const completeAuth = (authenticatedUser) => {
    setShowAuth(false);
    const destination = authenticatedUser.role
      ? authenticatedUser.role === "recruiter"
        ? "/post-job"
        : "/jobs"
      : "/onboarding";
    navigate(destination, { replace: true });
  };

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <nav className="flex items-center justify-between py-4">
        <img
          src={logo}
          className="h-20 cursor-pointer"
          onClick={() => navigate("/")}
          alt="TalentBliss logo"
        />
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!isLoaded ? null : !isSignedIn ? (
            <Button variant="outline" type="button" onClick={() => setShowAuth(true)}>
              Login
            </Button>
          ) : (
            <>
              {user.role === "recruiter" && (
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => navigate("/post-job")}
                >
                  <PenBox size={18} className="mr-2" />
                  Post a Job
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => navigate("/my-jobs")}>
                <BriefcaseBusiness size={18} className="mr-2" />
                My Jobs
              </Button>
              {user.role === "candidate" && (
                <Button type="button" variant="outline" onClick={() => navigate("/saved-jobs")}>
                  Saved Jobs
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={signOut} aria-label="Sign out">
                <LogOut size={18} />
              </Button>
            </>
          )}
        </div>
      </nav>
      <AuthDialog open={showAuth} onOpenChange={closeAuth} onAuthenticated={completeAuth} />
    </>
  );
};

export default Header;
