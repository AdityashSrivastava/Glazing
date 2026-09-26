import os
import glob

views_path = 'e:/Glazing/frontend/src/views/*.ts'
files = glob.glob(views_path)

replacements = {
    'bg-white/80 border-b border-black/5': 'bg-white/80 dark:bg-[#09090b]/80 border-b border-black/5 dark:border-white/10',
    'bg-white border border-border': 'bg-surface border border-border',
    'bg-white/95 backdrop-blur-md': 'bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md',
    'bg-white rounded-xl': 'bg-surface rounded-xl',
    'bg-white rounded-2xl': 'bg-surface rounded-2xl',
    'bg-white py-24': 'bg-bg py-24',
    'bg-white rounded w-full': 'bg-surface rounded w-full',
    'bg-white rounded w-5/6': 'bg-surface rounded w-5/6',
    'bg-white rounded w-4/6': 'bg-surface rounded w-4/6',
    'bg-white rounded-lg w-1/3': 'bg-surface rounded-lg w-1/3',
    'bg-white focus:bg-white': 'bg-white dark:bg-[#18181b] focus:bg-white dark:focus:bg-[#27272a]',
    'border-black/5': 'border-black/5 dark:border-white/10',
    'shadow-[0_50px_100px_rgba(50,50,93,0.1),0_15px_35px_rgba(0,0,0,0.07)]': 'shadow-lg dark:shadow-none',
    'shadow-[0_30px_60px_rgba(0,0,0,0.1)]': 'shadow-md dark:shadow-none',
    'shadow-[0_50px_100px_rgba(50,50,93,0.15),0_15px_35px_rgba(50,50,93,0.1),0_5px_15px_rgba(0,0,0,0.05)]': 'shadow-xl dark:shadow-none'
}

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
        
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(content)

print("patched")
