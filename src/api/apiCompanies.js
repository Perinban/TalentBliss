import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// - Get Companies
export async function getCompanies(token) {
    const supabase = await supabaseClient(token);

    const { data, error } = await supabase
        .from("companies")
        .select("*");

    if (error) {
        console.error("Error fetching Companies:", error);
        return null;
    }

    return data;
}

// - Add New Company
export async function addNewCompany(token, _, companyData) {
    const supabase = await supabaseClient(token);

    const random = Math.floor(Math.random() * 90000);
    const fileName = `logo-${random}-${companyData.name}`;

    const { error: storageError } = await supabase.storage
        .from("company-logo")
        .upload(fileName, companyData.logo);

    if (storageError) {
        console.error("Error Uploading Image", storageError);
        return null;
    }

    const logo_url = `${supabaseUrl}/storage/v1/object/public/company-logo/${fileName}`;

    console.log(companyData.name);
    console.log(logo_url);

    const { data, error } = await supabase
        .from("companies")
        .insert([
            {
                name: companyData.name,
                logo_url: logo_url,
            },
        ])
        .select();

    if (error) {
        console.error(error);
        throw new Error("Error submitting Companys");
    }

    return data;
}
