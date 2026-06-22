# SKS Finnish Folk Legend Index Card Checker

A browser-based tool for verifying transcriptions of Finnish folk legend index cards from the SKS (Finnish Literature Society) collection. Built for the Digital Humanities Center, Faculty of Humanities, University of Latvia.

**Live tool:** [https://ul-dhc.github.io/finnish-legend-card-checker](https://ul-dhc.github.io/finnish-legend-card-checker/)

## What it does

Each index card in the collection has been photographed and transcribed into Finnish text, then translated into English. This tool displays all three side by side so a reviewer can check whether the transcription matches the original card.

- Scanned card photo next to its Finnish transcription and English translation. 
- Tap any photo to zoom to full size for close reading. 
- Mark cards as **checked** (transcription is correct) or **flag** them (something looks off). 
- Add a free-text note per card explaining the issue. 
- Search across Finnish text, English text, place names, and source codes. 
- Filter by review status: All / Unreviewed / Checked / Flagged. 
- Sort by card order or TK archive code. 
- Switch between list view and grid view. 
- Progress bar showing how many cards have been reviewed. 
- **Review marks and notes are shared** — all changes are saved to Google Sheets in real time, so every reviewer sees the same up-to-date status. 

## How to use

The tool requires an internet connection (it reads and writes data to Google Sheets).

1. Open the tool via its GitHub Pages URL
2. Review each card by comparing the photo with the Finnish transcription
3. Mark the card as **checked** if the transcription is correct, or **flagged** if something looks off
4. Add a note if needed — it saves automatically after you stop typing
5. Your changes are visible to all reviewers immediately

## Technical setup

The tool consists of a single `index.html` file and a folder of scanned card images. Data and review status are stored in a Google Sheet, accessed via a Google Apps Script web app.

- **Frontend:** plain HTML, CSS, and vanilla JavaScript — no frameworks, no build step
- **Backend:** Google Apps Script (acts as a simple REST API)
- **Data:** Google Sheets (one row per card)
- **Hosting:** GitHub Pages

## License

MIT — free to use, modify, and distribute. See LICENSE for details.

## Contact

Digital Humanities Center · Faculty of Humanities · University of Latvia · [dhc@lu.lv](mailto:dhc@lu.lv)
