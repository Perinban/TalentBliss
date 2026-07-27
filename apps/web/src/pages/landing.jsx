import { useEffect, useMemo } from "react";
import Autoplay from "embla-carousel-autoplay";
import { BarLoader } from "react-spinners";
import { assetUrl } from "@/api/client";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useCompanies } from "@/hooks/companies-context";
import useSessionStorage from "@/hooks/useSessionStorage";
import { Link } from "@/routing";

const Landing = () => {
  const companiesHook = useCompanies();
  const companies = companiesHook.companies;
  const loading = companiesHook.loading;
  const error = companiesHook.error;
  const [companiesWithLogos, setCompaniesWithLogos] = useSessionStorage(
    "companiesWithLogos",
    [],
  );

  const filteredCompanies = useMemo(() => {
    if (!Array.isArray(companies)) return [];
    return companies.filter(({ logo_url }) => Boolean(logo_url)).slice(0, 30);
  }, [companies]);

  useEffect(() => {
    if (filteredCompanies.length === 0) return;

    setCompaniesWithLogos((previous) => {
      if (
        previous.length === filteredCompanies.length &&
        previous.every((company, index) => company.id === filteredCompanies[index].id)
      ) {
        return previous;
      }
      return filteredCompanies;
    });
  }, [filteredCompanies, setCompaniesWithLogos]);

  const uniqueCompanies = useMemo(() => {
    const uniqueIds = new Set();
    return companiesWithLogos.filter((company) => {
      if (uniqueIds.has(company.id)) return false;
      uniqueIds.add(company.id);
      return true;
    });
  }, [companiesWithLogos]);

  if (loading) return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  if (error) return <div>{error}</div>;

  return (
    <main className="flex flex-col gap-8 py-6 sm:gap-12 sm:py-10">
      <section className="px-4 text-center">
        <h1 className="gradient-title flex flex-col items-center justify-center text-2xl font-extrabold tracking-tighter sm:text-4xl lg:text-5xl">
          Find the Perfect Career.
          <span className="flex items-center gap-2 sm:gap-4">
            Connect with Exceptional Talent.
          </span>
        </h1>
        <p className="mt-4 py-5 text-xs text-gray-300 sm:text-sm">
          Unlock Career Growth or Find the Talent to Drive Your Success.
        </p>
      </section>

      <div className="-mt-4 flex justify-center gap-6">
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

      {uniqueCompanies.length > 0 ? (
        <Carousel plugins={[Autoplay({ delay: 2000 })]} className="-mt-5 w-full py-8 sm:py-10">
          <CarouselContent className="flex items-center gap-6 sm:gap-12">
            {uniqueCompanies.map(({ name, id, logo_url }) => (
              <CarouselItem key={id} className="basis-1/4 sm:basis-1/6 lg:basis-1/12">
                <img
                  src={assetUrl(logo_url)}
                  alt={name}
                  loading="lazy"
                  className="mx-auto h-16 object-contain sm:h-20 lg:h-24"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="-mt-5 w-full py-8 sm:py-10" />
      )}

      <section className="-mt-10 grid grid-cols-1 gap-6 px-4 sm:grid-cols-2">
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
