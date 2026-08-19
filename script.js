// ============================================================
// 1. CONFIGURATION
// ============================================================
console.log("🚀 Script is starting...");

const SUPABASE_URL = 'https://gkckxywjlxolropjkkco.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrY2t4eXdqbHhvbHJvcGpra2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTY5ODIsImV4cCI6MjEwMTg5Mjk4Mn0.aSZRpFHJkjOuWkaHdh07z64brCTau4Xr7rig5vPYyao';

// Initialize Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase initialized.");

// ============================================================
// 2. LOGIN BUTTON LOGIC
// ============================================================
document.getElementById('loginBtn').addEventListener('click', async function() {
    const errorEl = document.getElementById('loginError');
    const inviteCode = document.getElementById('inviteCodeInput').value.trim().toUpperCase();
    const displayName = document.getElementById('displayNameInput').value.trim();
    
    if (!inviteCode || !displayName) {
        errorEl.innerText = 'Please fill in both fields.';
        return;
    }

    errorEl.innerText = 'Checking code...';
    
    try {
        console.log("🔍 Searching for invite code:", inviteCode);
        
        // TRY TO FIND THE FAMILY IN SUPABASE
        const { data: family, error: familyError } = await supabaseClient
            .from('families')
            .select('*')
            .eq('invite_code', inviteCode)
            .single();

        // IF IT FAILS, SHOW THE EXACT ERROR
        if (familyError) {
            console.error("❌ Supabase Error:", familyError);
            errorEl.innerText = `Error: ${familyError.message || familyError.details || 'Unknown DB error'}`;
            return;
        }

        // IF NO FAMILY FOUND
        if (!family) {
            errorEl.innerText = 'Invite code not found. Make sure you ran the SQL script in Supabase.';
            return;
        }

        // IF WE GET HERE, IT WORKED!
        console.log("✅ Family found:", family);
        errorEl.style.color = "green";
        errorEl.innerText = "✅ Code valid! Logging you in...";
        
        // (Next step would be to load the app here)

    } catch (e) {
        console.error("❌ CRITICAL ERROR:", e);
        errorEl.innerText = "Critical error. Check console (F12) for details.";
    }
});
