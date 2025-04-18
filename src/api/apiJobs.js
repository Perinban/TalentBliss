import supabaseClient from "../utils/supabase";

// - Get Jobs
export async function getJobs(token, { state, country, company_id, searchQuery, descriptionQuery, page = 1, limit = 9 }) {
    const supabase = await supabaseClient(token);

    let query = supabase
        .from("jobs")
        .select("*, company:companies(name,logo_url), saved: saved_jobs(id)", {
            count: 'exact'
        })
        .order('created_at', { ascending: false });

    // Check for separate state and country parameters
    if (state) query = query.ilike("state", `%${state}%`);
    if (country) query = query.ilike("country", `%${country}%`);
    if (company_id) query = query.eq("company_id", company_id);
    if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
    if (descriptionQuery) query = query.ilike("description", `%${descriptionQuery}%`);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching Jobs:", error);
        throw error;
    }

    return {
        jobs: data, // Main data array
        total: count, // Total count for pagination (optional)
        page, // Current page (optional)
        limit // Items per page (optional)
    };
}


// - Delete Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
    const supabase = await supabaseClient(token);

    if (alreadySaved) {
        let query = supabase
            .from("saved_jobs")
            .delete()
            .eq("job_id", saveData.job_id);

        const { data, error: deleteError } = await query;

        if (deleteError) {
            console.error("Error Deleting Saved Jobs:", deleteError);
            return null;
        }

        return data;
    } else {
        let query = supabase
            .from("saved_jobs")
            .insert([saveData])
            .select();

        const { data, error: insertError } = await query;

        if (insertError) {
            console.error("Error Inserting Saved Jobs:", insertError);
            return null;
        }

        return data;
    }
}

// - Get Single Job
export async function getSingleJob(token, { job_id }) {
    const supabase = await supabaseClient(token);

    const { data, error } = await supabase
        .from("jobs")
        .select("*, company:companies(name,logo_url), applications: applications(*)")
        .eq("id", job_id)
        .single();

    if (error) {
        console.error("Error fetching Job:", error);
        return null;
    }

    return data;
}

// - Update Hiring Status
export async function updateHiringStatus(token, { job_id }, isOpen) {
    const supabase = await supabaseClient(token);

    const { data, error } = await supabase
        .from("jobs")
        .update({ isOpen })
        .eq("id", job_id)
        .select();

    if (error) {
        console.error("Error Updating Job:", error);
        return null;
    }

    return data;
}

// - Add New Job
export async function addNewJob(token, _, jobData) {
    const supabase = await supabaseClient(token);

    const { data, error } = await supabase
        .from("jobs")
        .insert([jobData])
        .select();

    if (error) {
        console.error(error);
        throw new Error("Error Creating Job");
    }

    return data;
}

// - Read Saved Jobs
export async function getSavedJobs(token) {
    const supabase = await supabaseClient(token);
    const { data, error } = await supabase
        .from("saved_jobs")
        .select("*, job: jobs(*, company: companies(name,logo_url))");

    if (error) {
        console.error("Error fetching Saved Jobs:", error);
        return null;
    }

    return data;
}

// - Get My Created Jobs
export async function getMyJobs(token, { recruiter_id, searchQuery, descriptionQuery, page = 1, limit = 9 }) {
    const supabase = await supabaseClient(token);

    let query = supabase
        .from("jobs")
        .select("*, company:companies(name,logo_url), saved: saved_jobs(id)", {
            count: 'exact'
        })
        .eq("recruiter_id", recruiter_id)
        .order('created_at', { ascending: false });

    // Optional filters
    if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);

    // Pagination logic
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching Jobs:", error);
        return null;
    }

    return {
        jobs: data, // Main data array
        total: count, // Total count for pagination (optional)
        page, // Current page (optional)
        limit // Items per page (optional)
    };
}

// - Delete Job
export async function deleteJob(token, { job_id }) {
    const supabase = await supabaseClient(token);

    const { data, error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job_id)
        .select();

    if (deleteError) {
        console.error("Error deleting job:", deleteError);
        return data;
    }

    return data;
}
