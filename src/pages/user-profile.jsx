import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { BarLoader } from "react-spinners";

// Create a function to get user profile
const getUserProfile = async (userId, supabase) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return { data };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { error };
  }
};

// Create a function to update user profile
const updateUserProfile = async (profileData, supabase) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { returning: 'minimal' });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error };
  }
};

const UserProfile = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    firstname: '',
    lastname: '',
    bio: '',
    pfp_url: '',
    skills: '',
    availability: false,
    total_jobs_completed: 0,
    ratings: 0,
  });

  // Import supabase dynamically to avoid the "is not a function" error
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    async function loadProfile() {
      try {
        setLoading(true);
        
        // Import supabase client dynamically
        const supabaseModule = await import("../utils/supabase");
        const supabase = supabaseModule.default;
        
        const { data, error } = await getUserProfile(user.id, supabase);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile(data);
        } else {
          // Initialize with Clerk user data if no profile exists
          setProfile(prev => ({
            ...prev,
            firstname: user.firstName || '',
            lastname: user.lastName || '',
            pfp_url: user.imageUrl || ''
          }));
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Couldn't load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [isLoaded, user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Save profile changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoaded || !user) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Import supabase client dynamically
      const supabaseModule = await import("../utils/supabase");
      const supabase = supabaseModule.default;
      
      const profileData = {
        id: user.id,
        firstname: profile.firstname,
        lastname: profile.lastname,
        bio: profile.bio,
        pfp_url: profile.pfp_url,
        skills: profile.skills,
        availability: profile.availability,
        total_jobs_completed: profile.total_jobs_completed || 0,
        ratings: profile.ratings || 0
      };
      
      const { success, error } = await updateUserProfile(profileData, supabase);
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Couldn't save your profile: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };
  
  if (!isLoaded || loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <BarLoader width={"100%"} color="#36d7b7" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto py-10 px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Personal Information</CardTitle>
              <p className="text-sm text-gray-600">
                Update your personal details and how others see you on the platform
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Success message */}
              {success && (
                <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-md">
                  <p>Your profile has been updated successfully.</p>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-md">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Profile picture */}
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={profile.pfp_url || user?.imageUrl} 
                    alt={profile.firstname}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x400?text=' + (profile.firstname?.charAt(0) || '');
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pfp_url">
                    Profile Picture URL
                  </label>
                  <Input 
                    id="pfp_url"
                    name="pfp_url"
                    value={profile.pfp_url || ''}
                    onChange={handleChange}
                    placeholder="Enter URL for your profile picture"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to use your Clerk profile picture
                  </p>
                </div>
              </div>
              
              <hr className="my-6" />
              
              {/* Basic details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="firstname">
                    First Name
                  </label>
                  <Input 
                    id="firstname"
                    name="firstname"
                    value={profile.firstname || ''}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="lastname">
                    Last Name
                  </label>
                  <Input 
                    id="lastname"
                    name="lastname"
                    value={profile.lastname || ''}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              {/* Bio */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="bio">
                  Bio
                </label>
                <textarea 
                  id="bio"
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us a bit about yourself"
                  className="w-full min-h-32 rounded-md border border-gray-300 p-2"
                  rows={4}
                />
              </div>
              
              {/* Skills */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="skills">
                  Skills (comma separated)
                </label>
                <textarea 
                  id="skills"
                  name="skills"
                  value={profile.skills || ''}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, React, Node.js"
                  className="w-full rounded-md border border-gray-300 p-2"
                  rows={3}
                />
              </div>
              
              {/* Availability */}
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="availability"
                  name="availability"
                  checked={profile.availability || false}
                  onChange={(e) => setProfile({...profile, availability: e.target.checked})}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <label htmlFor="availability" className="text-sm font-medium text-gray-700">
                  Available for new opportunities
                </label>
              </div>
              
              {/* Read-only stats */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Jobs Completed
                  </label>
                  <p className="text-2xl font-semibold text-green-700">{profile.total_jobs_completed || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Average Rating
                  </label>
                  <p className="text-2xl font-semibold text-green-700">
                    {profile.ratings ? profile.ratings.toFixed(1) : 'No ratings yet'}
                  </p>
                </div>
              </div>
            </CardContent>
            
            <div className="flex justify-end p-6">
              {saving && <BarLoader width={100} color="#36d7b7" className="mr-4" />}
              <Button 
                type="submit" 
                disabled={saving}
                variant="secondary"
                size="lg"
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default UserProfile;