// ============================================================
// 1. SAFETY CHECK & CONFIGURATION
// ============================================================
console.log("🚀 Script is starting...");

const SUPABASE_URL = 'https://gkckxywjlxolropjkkco.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrY2t4eXdqbHhvbHJvcGpra2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTY5ODIsImV4cCI6MjEwMTg5Mjk4Mn0.aSZRpFHJkjOuWkaHdh07z64brCTau4Xr7rig5vPYyao';

// Check if Supabase library loaded
if (typeof supabase === 'undefined') {
    console.error("❌ CRITICAL ERROR: Supabase library failed to load from CDN!");
    document.getElementById('loginError').innerText = "Error: Library failed to load. Refresh.";
} else {
    console.log("✅ Supabase library found. Initializing...");
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase initialized successfully.");

    // ============================================================
    // 2. SETUP LOGIN BUTTON
    // ============================================================
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        console.log("🖱️ Button clicked!");
        
        const inviteCode = document.getElementById('inviteCodeInput').value.trim().toUpperCase();
        const displayName = document.getElementById('displayNameInput').value.trim();
        
        if (!inviteCode || !displayName) {
            document.getElementById('loginError').innerText = 'Please fill in both fields.';
            return;
        }

        document.getElementById('loginError').innerText = 'Checking code...';
        console.log("Attempting login with code:", inviteCode);

        // We only test the connection here to verify it works
        alert("If you see this alert, the button is working! Now check the SQL tables.");
    });
}
