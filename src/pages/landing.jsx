import { Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanies } from "@/hooks/companies-context";
import Autoplay from "embla-carousel-autoplay";
import { BarLoader } from "react-spinners";
import useSessionStorage from "@/hooks/useSessionStorage";
import { useUser } from "@clerk/clerk-react";

const Landing = () => {
    const { user, isSignedIn } = useUser();
    const { companies, loading, error } = isSignedIn ? useCompanies() : { companies: [], loading: false, error: null };
    const [companiesWithLogos, setCompaniesWithLogos] = useSessionStorage("companiesWithLogos", []);

    useEffect(() => {

        if (!user || !Array.isArray(companies) || companies.length === 0) return;

        const filtered = companies
            .filter(({ logo_url }) => Boolean(logo_url))
            .slice(0, 30);

        setCompaniesWithLogos(prev => {
            const prevIds = new Set(prev.map(c => c.id));
            const newIds = new Set(filtered.map(c => c.id));
            const same = [...prevIds].every(id => newIds.has(id)) && prev.length === filtered.length;
            return same ? prev : filtered;
        });
    }, [user, companies, setCompaniesWithLogos]);

    const uniqueCompanies = Array.from(new Set(companiesWithLogos.map(c => c.id)))
        .map(id => companiesWithLogos.find(c => c.id === id));

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <main className="flex flex-col gap-8 sm:gap-12 py-6 sm:py-10">
            {/* Hero Section */}
            <section className="text-center px-4">
                <h1 className="flex flex-col items-center justify-center gradient-title text-2xl font-extrabold sm:text-4xl lg:text-5xl tracking-tighter">
                    Find the Perfect Career.
                    <span className="flex items-center gap-2 sm:gap-4">Connect with Exceptional Talent.</span>
                </h1>
                <p className="text-gray-300 mt-4 text-xs sm:text-sm py-5">
                    Unlock Career Growth or Find the Talent to Drive Your Success.
                </p>
            </section>

            {/* Action Buttons */}
            <div className="flex gap-6 justify-center -mt-4">
                <Link to="/jobs">
                    <Button variant="blue" size="lg" className="w-48">
                        Browse Jobs
                    </Button>
                </Link>
                <Link to="/post-job">
                    <Button variant="destructive" size="lg" className="w-48">
                        Create a Job Listing
                    </Button>
                </Link>
            </div>

            {/* Carousel Section */}
            {isSignedIn && uniqueCompanies.length > 0 ? (
                <Carousel plugins={[Autoplay({ delay: 2000 })]} className="w-full py-8 sm:py-10 -mt-5">
                    <CarouselContent className="flex gap-6 sm:gap-12 items-center">
                        {uniqueCompanies.map(({ name, id, logo_url }) => (
                            <CarouselItem key={id} className="basis-1/4 sm:basis-1/6 lg:basis-1/12">
                                <img
                                    src={logo_url}
                                    alt={name}
                                    className="h-16 sm:h-20 lg:h-24 object-contain mx-auto"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            ) : (
                <div className="w-full py-8 sm:py-10 -mt-5"></div>
            )}

            {/* Information Cards Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 -mt-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Discover Your Dream Job</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Explore Exciting Listings, Submit Applications, and Follow Your Success.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Attract Top Talent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Advertise Job Openings, Manage Applications, and Build Your Winning Team</p>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
};

export default Landing;