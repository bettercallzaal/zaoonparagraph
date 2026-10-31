---
name: zabal-cover
description: Make the daily Year of the ZABAL cover. Change the day number in the ZABAL Daily Designs Canva file with Claude in Chrome, download that one page, and put it on the Paragraph draft. Trigger - /zabal-cover, "make the cover", "change the day in Canva".
---

# zabal-cover - the daily cover, from Canva to the Paragraph draft

First run: Day 304, 2026-10-31, on Zaal's ask. Everything below is marked by whether that run proved it.

## Inputs

- **Day number:** the day of the year of the edition's date, not today's: `date -j -f %Y-%m-%d <edition-date> +%-j`. An edition finalised the evening before carries tomorrow's number. Never typed from memory.
- **Design:** ZABAL Daily Designs (11 pages, 900 x 600). Zaal changed sharing to "can view" on 2026-10-31, so the cover edit runs under his own Canva login in his Chrome, not through a link. Whether the old link now opens view-only was not confirmed: a logged-out test hit Canva's bot wall. Treat any share link as a secret. If one is needed it lives only in `~/.zao/private/canva-zabal.env`, chmod 600, saved by Zaal with `zao-env save canva-zabal` under the key `CANVA_ZABAL_DESIGN_URL`. Never write it in this repo, a PR, a status file or a message.
- **Draft:** the edition's editor link on app.paragraph.com, not paragraph.com.

## Steps

Use `mcp__claude-in-chrome__*` on Zaal's logged-in Chrome, in a new tab.

1. **Open the design and read page 1.** Find it by name from canva.com under his login (not yet run this way). Page 1 read "DAY 303" on the first run. If it does not read yesterday's number, stop and ask, because someone else may have changed the file.
2. **Change the number (proved).** Double-click the Day label, press `cmd+Right`, delete the digits that change, type the new ones, then click off the canvas. Only the last digit changed on the first run. Crossing a ten, such as 309 to 310, needs more digits replaced (not yet run).
3. **Check it.** Screenshot and read the label before downloading.
4. **Download one page (proved).** Share, Download, PNG, then **This page (1)**. The panel defaults to **All**, so zoom in and confirm the selection before pressing Download.
5. **Check the file.** Look in `~/Downloads` for a file newer than step 4, and open it to read the number. Canva's "Completed" toast does not prove a file landed.
6. **Put it on the draft (NOT proved).** Zaal's tap, or cite his word for this edition before doing it. Open the draft and locate the cover's file input with `find`. Pass the path to `mcp__claude-in-chrome__file_upload`. Do not click Upload, because that opens a native picker you cannot see. Reload and confirm the cover persisted.
7. **Close your tab.**

## What still needs Zaal

- **The edit itself.** This changes a shared design that other people can see. Run it only on his word for that edition.
- **Chrome's download prompt.** On the first run Canva reported Completed, but nothing landed until Zaal accepted a prompt and the toast's "click here" link was used. The file arrived as `download.png`, not `ZABAL Daily Designs.png`. Allowing downloads for canva.com in Chrome is his setting to change, never this skill's.
- **Reading from Downloads.** `file_upload` refused `~/Downloads/download.png`: "only files this session is allowed to read can be uploaded." The error names the fix, Zaal sharing the file or adding the folder with `/add-dir`. Report it as BLOCKED. Do not route around it with a copy or injected page script.
- **Publishing.** This skill never publishes, schedules or posts.

## Guards

- Change only the day number, on only that page. Canva saves edits to the shared design as you go.
- If the tab group has vanished, call `tabs_context_mcp` again. Tab ids do not carry over.
- Do not change sharing from here.
