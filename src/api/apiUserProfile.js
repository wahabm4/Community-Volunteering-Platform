import supabaseClient from "@/utils/supabase";

// Get user profile
export async function getUserProfile(token, { userId }) {
  const supabase = await supabaseClient(token);
  
  // Convert the Clerk userId to a number if your DB expects an integer
  const numericId = parseInt(userId.replace(/\D/g, '').slice(0, 10), 10);
  
  console.log("Looking for profile with numeric ID:", numericId);
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", numericId)
    .single();

  console.log("Profile lookup result:", { data, error });

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

// Update user profile
export async function updateUserProfile(token, _, profileData) {
  const supabase = await supabaseClient(token);
  
  // Convert the ID to a number for database compatibility
  const numericId = parseInt(profileData.id.replace(/\D/g, '').slice(0, 10), 10);
  
  const updatedData = {
    ...profileData,
    id: numericId
  };
  
  console.log("Updating profile with data:", updatedData);
  
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert([updatedData])
    .select();

  console.log("Update result:", { data, error });

  if (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Error updating profile");
  }

  return data[0];
}