import glob
import os
import re

files = ["e:/Glazing/frontend/src/views/leaderboard.ts", 
         "e:/Glazing/frontend/src/views/goals.ts", 
         "e:/Glazing/frontend/src/views/analytics.ts", 
         "e:/Glazing/frontend/src/views/bounties.ts"]

html_old = """             <button id="logout-btn" class="text-body hover:text-primary text-[13px] font-medium transition-colors">Sign Out</button>
          </div>"""

html_new = """             <!-- Profile Dropdown -->
             <div class="relative">
                <button id="profile-dropdown-btn" class="flex items-center space-x-2 text-body hover:text-primary transition-colors focus:outline-none">
                  <div class="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
                    <span id="profile-initial" class="text-xs font-bold font-mono text-primary">U</span>
                  </div>
                  <span id="profile-name" class="text-[13px] font-medium">Loading...</span>
                  <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                <div id="profile-dropdown-menu" class="hidden absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg shadow-black/5 z-50 py-1 origin-top-right">
                  <div class="px-4 py-2 border-b border-border/50">
                     <p class="text-[10px] text-muted font-mono uppercase tracking-wider">Account</p>
                     <p id="profile-email" class="text-xs text-primary font-medium truncate">...</p>
                  </div>
                  <a href="#" class="block px-4 py-2 text-[13px] text-body hover:bg-surface hover:text-primary transition-colors">Settings</a>
                  <a href="#" class="block px-4 py-2 text-[13px] text-body hover:bg-surface hover:text-primary transition-colors">Preferences</a>
                  <button id="logout-btn" class="w-full text-left block px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">Sign Out</button>
                </div>
             </div>
          </div>"""

# For dashboard.ts it was different (had open modal btn). Wait, leaderboard.ts just has <button id="logout-btn">
# But dashboard had <button id="open-modal-btn"> as well.
# I will just replace the exact line of <button id="logout-btn"... with the new html

for f in files:
    with open(f, "r") as fp:
        content = fp.read()
    
    # replace HTML
    content = content.replace('<button id="logout-btn" class="text-body hover:text-primary text-[13px] font-medium transition-colors">Sign Out</button>\n          </div>', html_new)
    
    # insert logic at the end of the logout event listener
    # Search for logoutBtn setup
    
    logic_addition = """
  const profileDropdownBtn = document.getElementById('profile-dropdown-btn') as HTMLButtonElement;
  const profileDropdownMenu = document.getElementById('profile-dropdown-menu') as HTMLDivElement;
  if (profileDropdownBtn && profileDropdownMenu) {
    profileDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdownMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
        if (!profileDropdownMenu.classList.contains('hidden')) {
            profileDropdownMenu.classList.add('hidden');
        }
    });
  }

  apiFetch('/users/me').then((user: any) => {
      const nameEl = document.getElementById('profile-name');
      const initialEl = document.getElementById('profile-initial');
      if (nameEl) nameEl.textContent = user.display_name;
      if (initialEl && user.display_name) initialEl.textContent = user.display_name.charAt(0).toUpperCase();
  }).catch(() => {});

  supabase.auth.getSession().then(({data: {session}}) => {
      const emailEl = document.getElementById('profile-email');
      if (emailEl && session?.user?.email) emailEl.textContent = session.user.email;
  });
"""
    # Just append it below the setup logic start
    if 'apiFetch(\'/users/me\')' not in content:
        # Find first line of setup function
        content = re.sub(r'const logoutBtn = document\.getElementById\(\'logout-btn\'\) as HTMLButtonElement;\n', 
                         r'const logoutBtn = document.getElementById(\'logout-btn\') as HTMLButtonElement;\n' + logic_addition, 
                         content)

    with open(f, "w") as fp:
        fp.write(content)
print("done")
