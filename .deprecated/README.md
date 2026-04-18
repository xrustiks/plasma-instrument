# DEPRECATED - Static Article Files

This folder contains the old static article HTML files that have been **deprecated** and replaced by the CMS (Content Management System).

## Status
- **Last Updated**: April 18, 2026
- **Migration Deadline**: May 30, 2026
- **Status**: DEPRECATED - scheduled for permanent removal

## What's Here
- `sections/` - Old Russian static article pages (blog, services, projects, sources)
- `en_sections/` - Old English static article pages

## Why Deprecated?
All static article content has been migrated to the CMS database:
- Location: `server/storage/data/articles.json`
- CMS is now serving all article content dynamically
- Code rendering articles is in `client/scripts/browser/cms-content.js`

## Verification Checklist Before Deletion
- [x] All articles migrated to CMS (33 articles imported)
- [x] CMS articles display correctly in all sections
- [ ] Production tested for 2+ weeks
- [ ] No external links pointing to /sections/ paths
- [ ] Team confirms safe to delete

## How to Restore
If needed, old articles can be recovered from:
1. Git history: `git checkout HEAD~N -- client/sections/`
2. This folder: copy back from `.deprecated/sections/`
3. Archive backups

## Next Steps
- Monitor production for any issues (until May 30, 2026)
- After verification period, safely delete this folder
- Update any documentation referring to static article structure

## References
- Migration notes: `MIGRATION_NOTES.md`
- CMS implementation: `client/scripts/browser/cms-content.js`
- Article data: `server/storage/data/articles.json`
