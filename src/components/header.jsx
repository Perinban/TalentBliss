import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import {
    SignedIn,
    SignedOut,
    SignIn,
    UserButton,
    useUser,
} from "@clerk/clerk-react";
import { BriefcaseBusiness, PenBox } from "lucide-react";
import { useEffect, useState } from "react";

import logo from "@/assets/logo.png";

const Header = () => {
    const [showSignin, setShowSignin] = useState(false);
    const [search, setSearch] = useSearchParams();
    const { isLoaded, user } = useUser();
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
    };

    useEffect(() => {
        if (search.get("sign-in")) {
            setShowSignin(true);
        }
    }, [search]);

    useEffect(() => {
        if (isLoaded && user) {
            handleNavigation("/onboarding");
        }
    }, [isLoaded, user, navigate]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowSignin(false);
            setSearch({});
        }
    };

    return (
        <>
            <nav className="py-4 flex justify-between items-center">
                <img
                    src={logo}
                    className="h-20 cursor-pointer"
                    onClick={() => handleNavigation("/")}
                    alt="Platform logo"
                />

                <div className="flex gap-8">
                    <SignedOut>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setShowSignin(true)}
                        >
                            Login
                        </Button>
                    </SignedOut>

                    <SignedIn>
                        {user?.unsafeMetadata?.role === "recruiter" && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="rounded-full"
                                onClick={() => handleNavigation("/post-job")}
                            >
                                <PenBox size={20} className="mr-2" />
                                Post a Job
                            </Button>
                        )}

                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10",
                                },
                            }}
                        >
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="My Jobs"
                                    labelIcon={<BriefcaseBusiness size={15} />}
                                    onClick={() => handleNavigation("/my-jobs")}
                                />
                                <UserButton.Action
                                    label="Saved Jobs"
                                    labelIcon={<BriefcaseBusiness size={15} />}
                                    onClick={() => handleNavigation("/saved-jobs")}
                                />
                            </UserButton.MenuItems>
                        </UserButton>
                    </SignedIn>
                </div>
            </nav>

            {showSignin && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={handleOverlayClick}
                >
                    <SignIn
                        afterSignInUrl="/TalentBliss/onboarding"
                        onSignIn={() => handleNavigation("/onboarding")}
                    />
                </div>
            )}
        </>
    );
};

export default Header;