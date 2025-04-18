import {Link, useSearchParams} from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";

import {SignedIn, SignedOut, SignIn, UserButton, useUser} from "@clerk/clerk-react";
import {BriefcaseBusiness, Heart, HeartCrack, PenBox} from "lucide-react";
import {useEffect, useState} from "react";

const Header = () => {

    const [showSignin, setShowSignin] = useState(false);

    const [search, setSearch] = useSearchParams();

    const { user } = useUser();

    useEffect(()=> {
        if(search.get('sign-in')){
            setShowSignin(true);
        }
    },[search]);

    const handleOverlayClick=(e)=>{
        if (e.target === e.currentTarget){
            setShowSignin(false);
            setSearch({});
        }
    };

    return <>
        <nav className="py-4 flex justify-between items-center">
            <Link to="/TalentBliss">
                <img src="logo.png" className="h-20"/>
            </Link>

            <div className="flex gap-8">
                <SignedOut>
                    <Button variant="outline" onClick={()=> setShowSignin(true)}>Login</Button>
                </SignedOut>
                <SignedIn>
                    { user?.unsafeMetadata?.role === "recruiter" && (
                        <Link to="/TalentBliss/post-job/">
                            <Button variant="destructive" className="rounded-full">
                                <PenBox size={20} className="mr-2"/>
                                Post a Job
                            </Button>
                        </Link>
                    )}
                    <UserButton appearance={{
                        elements: {
                            avatarBox:"w-10 h-10",
                        },
                    }}>
                        <UserButton.MenuItems>
                            <UserButton.Link
                                label="My Jobs"
                                labelIcon={<BriefcaseBusiness size={15} />}
                                href="/TalentBliss/my-jobs/"
                            />
                            <UserButton.Link
                                label="Saved Jobs"
                                labelIcon={<Heart size={15} />}
                                href="/TalentBliss/saved-jobs/"
                            />
                        </UserButton.MenuItems>
                    </UserButton>
                </SignedIn>
            </div>

        </nav>

        {showSignin && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                 onClick={handleOverlayClick}
            >
                <SignIn
                    signUpForceRedirectUrl="/TalentBliss/onboarding/"
                    fallbackRedirectUrl="/TalentBliss/onboarding/"
                />
            </div>
        )}

    </>;
}

export default Header;