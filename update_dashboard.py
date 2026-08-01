import re

path = 'client/src/pages/OwnerDashboard/OwnerDashboard.jsx'
with open(path, 'r') as f:
    content = f.read()

# Replace general background classes
content = content.replace('"min-h-[calc(100vh-4rem)] bg-slate-50 py-10"', '"min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 transition-colors duration-200 py-10"')
content = content.replace('bg-white', 'bg-white dark:bg-slate-900')
content = content.replace('bg-slate-50', 'bg-slate-50 dark:bg-slate-900')

# Text colors
content = content.replace('text-slate-900', 'text-slate-900 dark:text-white')
content = content.replace('text-slate-800', 'text-slate-800 dark:text-slate-200')
content = content.replace('text-slate-700', 'text-slate-700 dark:text-slate-300')
content = content.replace('text-slate-600', 'text-slate-600 dark:text-slate-400')
content = content.replace('text-slate-500', 'text-slate-500 dark:text-slate-400')

# Border colors
content = content.replace('border-slate-200', 'border-slate-200 dark:border-slate-700')
content = content.replace('border-slate-100', 'border-slate-100 dark:border-slate-800')

# Inputs
content = content.replace('bg-slate-50 focus:bg-white', 'bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white')

# Specific fixes for over-replacements
content = content.replace('dark:bg-slate-900 dark:bg-slate-900', 'dark:bg-slate-900')

with open(path, 'w') as f:
    f.write(content)
