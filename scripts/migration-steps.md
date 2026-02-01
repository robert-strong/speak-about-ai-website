# Safe Speaker Migration Process

To avoid field mapping issues when migrating all speakers, follow this step-by-step process:

## Step 1: Prepare Your CSV
1. Export your Google Sheets as CSV
2. Ensure the header row matches exactly: `SLUG,NAME,TITLE,FEATURED,IMAGE,BIO,FEE,LOCATION,PROGRAMS,LISTED,EXPERTISE,INDUSTRIES,RANKING,IMAGEPOSITION,IMAGEOFFSET,VIDEOS,TESTIMONIALS`

## Step 2: Test with Sample Data First
1. Take your full CSV and create a test file with just 2-3 speakers
2. Run: `node csv-to-sql-converter.js`
3. Review the validation output carefully
4. Check that:
   - Bio shows the actual biography text
   - Image shows "Present" 
   - Fee shows the actual fee range
   - Videos/Testimonials show "Valid JSON"

## Step 3: Fix Any Issues
If validation shows problems:
- **Bio in wrong field**: The CSV may have parsing issues with multiline text
- **Fee showing "TRUE"**: Indicates column misalignment  
- **Invalid JSON**: Videos/testimonials have formatting issues

## Step 4: Use Batch Migration
Instead of migrating all speakers at once:
1. Migrate 5-10 speakers at a time
2. Test each batch on the website
3. Fix any issues before proceeding
4. This prevents having to fix hundreds of records

## Step 5: Alternative - Manual SQL Approach
If CSV parsing continues to fail:
1. I can create individual INSERT statements for each speaker
2. You provide the speaker data in a structured format
3. We manually map each field to ensure accuracy

## Current Status
✅ Database schema is ready
✅ API integration is working  
✅ Website displays from database
⚠️ CSV parsing needs refinement for complex data

## Next Steps
1. Run the manual SQL fix I provided earlier to correct Peter/Adam
2. Test website display
3. Once working, we'll tackle the full migration