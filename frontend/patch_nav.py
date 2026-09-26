import os
import glob
import re

views = glob.glob(r"e:\Glazing\frontend\src\views\*.ts")

for view in views:
    if "landing" in view or "login" in view or "bounties" in view:
        continue
    
    with open(view, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Add <a href="#" id="nav-bounties" ... to the nav
    nav_bounties_link = r'<a href="#" id="nav-bounties" class="text-body hover:text-primary text-[13px] font-medium transition-colors">Bounties</a>'
    
    if "nav-bounties" not in content:
        content = re.sub(
            r'(<a href="#" id="nav-analytics".*?>Analytics</a>)',
            r'\1\n              ' + nav_bounties_link,
            content
        )
    
    # 2. Add event listener in logic
    if "navBounties" not in content:
        content = re.sub(
            r'(const navAnalytics = document.getElementById\(\'nav-analytics\'\) as HTMLAnchorElement;)',
            r'\1\n  const navBounties = document.getElementById(\'nav-bounties\') as HTMLAnchorElement;',
            content
        )
        content = re.sub(
            r'(if \(navAnalytics\) navAnalytics.addEventListener\(\'click\', \(e\) => { e.preventDefault\(\); navigateFn\(\'analytics\'\); }\);)',
            r'\1\n  if (navBounties) navBounties.addEventListener(\'click\', (e) => { e.preventDefault(); navigateFn(\'bounties\'); });',
            content
        )
        
    # 3. Enhance error messages UI
    content = re.sub(
        r'<div class="theme-card border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs data-text">',
        r'<div class="theme-card border-rose-500/30 bg-rose-500/5 text-rose-500 text-sm font-semibold p-4 shadow-sm text-center">',
        content
    )
    content = re.sub(
        r'System Error: Failed to fetch',
        r'System Offline: Could not establish secure connection to terminal.',
        content
    )
        
    with open(view, "w", encoding="utf-8") as f:
        f.write(content)
