import os
import re

files = ["e:/Glazing/frontend/src/views/goals.ts", 
         "e:/Glazing/frontend/src/views/analytics.ts", 
         "e:/Glazing/frontend/src/views/bounties.ts"]

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

for f in files:
    with open(f, "r") as fp:
        content = fp.read()
    
    if "apiFetch('/users/me')" not in content:
        content = re.sub(r'const logoutBtn = document\.getElementById\(\'logout-btn\'\) as HTMLButtonElement;\n', 
                         r'const logoutBtn = document.getElementById(\'logout-btn\') as HTMLButtonElement;\n' + logic_addition, 
                         content)

    with open(f, "w") as fp:
        fp.write(content)
