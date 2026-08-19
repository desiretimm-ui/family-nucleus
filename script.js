// ============================================================
// 1. CONFIGURE SUPABASE
// ============================================================
const SUPABASE_URL = 'https://gkckxywjlxolropjkkco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrY2t4eXdqbHhvbHJvcGpra2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTY5ODIsImV4cCI6MjEwMTg5Mjk4Mn0.aSZRpFHJkjOuWkaHdh07z64brCTau4Xr7rig5vPYyao';

// SAFETY CHECK: Make sure Supabase library loaded before running
if (typeof window.supabase !== 'undefined') {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase initialized.");

    // ============================================================
    // 2. GLOBAL STATE
    // ============================================================
    let currentFamilyId = null;
    let currentUser = null; 
    let currentEventId = null;
    let allFamilyEvents = [];
    let currentChannel = null;

    // ============================================================
    // 3. QUESTION BANK
    // ============================================================
    const questionBank = {
        birthday: {
            questions: [
                { label: "What age?", type: "text", key: "age" },
                { label: "Theme (e.g., Dinosaurs)?", type: "text", key: "theme" },
                { label: "How many guests?", type: "number", key: "guests" }
            ],
            defaultChecklist: ["Order Cake", "Buy Decorations", "Plan Games", "Goodie Bags"]
        },
        anniversary: {
            questions: [
                { label: "How many years?", type: "number", key: "years" },
                { label: "Romantic or Adventurous?", type: "text", key: "vibe" }
            ],
            defaultChecklist: ["Book Restaurant", "Buy Flowers", "Arrange Sitter", "Write Card"]
        },
        dinner: {
            questions: [
                { label: "Cuisine preference?", type: "text", key: "cuisine" },
                { label: "Budget per person?", type: "number", key: "budget" }
            ],
            defaultChecklist: ["Send Invites", "Plan Menu", "Buy Drinks", "Set Table"]
        },
        other: {
            questions: [
                { label: "What is the event name/type?", type: "text", key: "custom_type" }
            ],
            defaultChecklist: ["Set a Date", "Send Invitations", "Plan Food/Menu", "Arrange Venue"]
        }
    };

    // ============================================================
    // 4. LOGIN / LOGOUT
    // ============================================================
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const inviteCode = document.getElementById('inviteCodeInput').value.trim().toUpperCase();
        const displayName = document.getElementById('displayNameInput').value.trim();
        
        if (!inviteCode || !displayName) {
            document.getElementById('loginError').innerText = 'Please fill in both fields.';
            return;
        }

        const { data: family, error: familyError } = await supabase
            .from('families')
            .select('*')
            .eq('invite_code', inviteCode)
            .single();

        if (familyError || !family) {
            document.getElementById('loginError').innerText = 'Invite code not found. Use TEST123 for testing.';
            return;
        }

        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
            document.getElementById('loginError').innerText = 'Auth error: ' + authError.message;
            return;
        }

        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (!existingProfile) {
            await supabase.from('profiles').insert({
                id: authData.user.id,
                family_id: family.id,
                display_name: displayName,
                is_admin: false
            });
        }

        currentFamilyId = family.id;
        currentUser = { id: authData.user.id, display_name: displayName };
        localStorage.setItem('familyOS_session', JSON.stringify({ familyId: family.id, userId: authData.user.id, name: displayName }));

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('welcomeUser').innerText = `Welcome, ${displayName}! (${family.name})`;
        
        await loadEventSelector();
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('familyOS_session');
        location.reload();
    });

    // ============================================================
    // 5. EVENT SELECTOR
    // ============================================================
    async function loadEventSelector() {
        if (!currentFamilyId) return;
        
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .eq('family_id', currentFamilyId)
            .order('created_at', { ascending: false });

        if (error) return;
        allFamilyEvents = events;
        
        const selector = document.getElementById('eventSelector');
        selector.innerHTML = '<option value="">-- Load an existing event --</option>';
        
        events.forEach(ev => {
            const typeLabel = ev.type.charAt(0).toUpperCase() + ev.type.slice(1);
            const detailPreview = ev.details?.custom_type || ev.details?.theme || ev.details?.cuisine || '';
            const label = `${typeLabel} ${detailPreview ? '('+detailPreview+')' : ''} - ${new Date(ev.created_at).toLocaleDateString()}`;
            const option = document.createElement('option');
            option.value = ev.id;
            option.textContent = label;
            selector.appendChild(option);
        });

        if (events.length > 0) {
            selector.value = events[0].id;
            loadEventById(events[0].id);
        }
    }

    document.getElementById('eventSelector').addEventListener('change', function() {
        if (this.value) {
            loadEventById(this.value);
        } else {
            document.getElementById('results').style.display = 'none';
            currentEventId = null;
        }
    });

    async function loadEventById(eventId) {
        currentEventId = eventId;
        document.getElementById('results').style.display = 'block';
        document.getElementById('step-2').style.display = 'none';
        document.getElementById('eventType').value = '';
        
        const event = allFamilyEvents.find(e => e.id === eventId);
        if (event) {
            const typeLabel = event.type.charAt(0).toUpperCase() + event.type.slice(1);
            const detail = event.details?.custom_type || event.details?.theme || event.details?.cuisine || '';
            document.getElementById('currentEventTitle').innerText = `${typeLabel} ${detail}`;
        }
        
        loadTasks(eventId);
    }

    // ============================================================
    // 6. EVENT WIZARD
    // ============================================================
    document.getElementById('eventType').addEventListener('change', function() {
        const type = this.value;
        const step2 = document.getElementById('step-2');
        const questionArea = document.getElementById('question-area');
        
        if (!type || !questionBank[type]) {
            step2.style.display = 'none';
            return;
        }
        step2.style.display = 'block';
        
        const data = questionBank[type];
        let html = '';
        data.questions.forEach(q => {
            html += `<label>${q.label}</label><input type="${q.type}" id="q_${q.key}" placeholder="Enter details...">`;
        });
        questionArea.innerHTML = html;
    });

    // ============================================================
    // 7. CREATE NEW EVENT
    // ============================================================
    document.getElementById('createEventBtn').addEventListener('click', async () => {
        const type = document.getElementById('eventType').value;
        const data = questionBank[type];
        if (!data || !currentFamilyId) return;

        let details = {};
        data.questions.forEach(q => {
            const input = document.getElementById(`q_${q.key}`);
            if (input) details[q.key] = input.value;
        });

        const { data: newEvent, error } = await supabase
            .from('events')
            .insert({ family_id: currentFamilyId, type: type, details: details })
            .select()
            .single();

        if (error) { alert('Error creating event: ' + error.message); return; }

        const tasksToInsert = data.defaultChecklist.map(task => ({
            event_id: newEvent.id,
            family_id: currentFamilyId,
            task_name: task,
            assigned_to: null,
            is_done: false
        }));
        await supabase.from('tasks').insert(tasksToInsert);

        await loadEventSelector();
        document.getElementById('eventSelector').value = newEvent.id;
        loadEventById(newEvent.id);
    });

    // ============================================================
    // 8. LOAD TASKS
    // ============================================================
    async function loadTasks(eventId) {
        if (currentChannel) {
            await supabase.removeChannel(currentChannel);
        }

        currentChannel = supabase
            .channel(`tasks_${eventId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'tasks',
                filter: `event_id=eq.${eventId}` 
            }, () => {
                renderChecklist();
            })
            .subscribe();

        renderChecklist();
    }

    async function renderChecklist() {
        if (!currentEventId) return;
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('event_id', currentEventId)
            .order('created_at', { ascending: true });

        if (error) return;
        const container = document.getElementById('checklist');
        container.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;">No tasks yet. Add one below!</p>';
            return;
        }

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #eee; flex-wrap:wrap;';
            div.innerHTML = `
                <input type="checkbox" ${task.is_done ? 'checked' : ''} data-id="${task.id}">
                <span style="flex:2; min-width:100px; ${task.is_done ? 'text-decoration:line-through; color:#94a3b8;' : ''}">${task.task_name}</span>
                <select data-id="${task.id}" style="width:auto; padding:4px; font-size:12px; margin:0; flex:1; min-width:80px;">
                    <option value="">Unassigned</option>
                    <option value="Mom" ${task.assigned_to === 'Mom' ? 'selected' : ''}>Mom</option>
                    <option value="Dad" ${task.assigned_to === 'Dad' ? 'selected' : ''}>Dad</option>
                    <option value="Teen" ${task.assigned_to === 'Teen' ? 'selected' : ''}>Teen</option>
                    <option value="Grandma" ${task.assigned_to === 'Grandma' ? 'selected' : ''}>Grandma</option>
                </select>
                <button style="width:auto; background:#ef4444; padding:4px 12px; margin:0; flex:0;" data-id="${task.id}">✕</button>
            `;
            container.appendChild(div);
        });

        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', async function() {
                await supabase.from('tasks').update({ is_done: this.checked }).eq('id', this.dataset.id);
            });
        });
        container.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', async function() {
                await supabase.from('tasks').update({ assigned_to: this.value || null }).eq('id', this.dataset.id);
            });
        });
        container.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (confirm('Delete this task?')) {
                    await supabase.from('tasks').delete().eq('id', this.dataset.id);
                    renderChecklist();
                }
            });
        });
    }

    // ============================================================
    // 9. ADD NEW TASK
    // ============================================================
    document.getElementById('addTaskBtn').addEventListener('click', async () => {
        const input = document.getElementById('newTaskInput');
        if (!input.value.trim() || !currentEventId) return;
        await supabase.from('tasks').insert({
            event_id: currentEventId,
            family_id: currentFamilyId,
            task_name: input.value.trim(),
            assigned_to: null,
            is_done: false
        });
        input.value = '';
        renderChecklist();
    });

    // ============================================================
    // 10. AI SEARCH
    // ============================================================
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const container = document.getElementById('searchResults');
        container.innerHTML = '🔍 Searching for suggestions...';
        
        try {
            const { data: event, error } = await supabase
                .from('events')
                .select('type, details')
                .eq('id', currentEventId)
                .single();
            
            if (error) throw error;

            const payload = { type: event.type, details: event.details || {} };
            const response = await fetch('/.netlify/functions/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            container.innerHTML = `
                <div style="background:#f0fdf4; padding:12px; border-radius:12px; margin-top:8px;">
                    <p>💡 <strong>Tip:</strong> ${result.tip}</p>
                    <a href="${result.url}" target="_blank" style="display:block; text-align:center; background:#3b82f6; color:white; padding:12px; border-radius:12px; text-decoration:none; margin-top:10px;">
                        🔗 Open Google Search
                    </a>
                </div>
            `;
        } catch (e) {
            container.innerHTML = '⚠️ Error loading search. Make sure Netlify function is deployed.';
            console.error(e);
        }
    });
} else {
    console.error("❌ Supabase library failed to load.");
    document.getElementById('loginError').innerText = "Error: Supabase library failed to load. Refresh.";
}
