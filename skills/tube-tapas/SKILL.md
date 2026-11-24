---
name: tube-tapas
version: 2026-11-24
description: >
  Turn a recorded talk (YouTube or any site yt-dlp supports) into one portable
  folder: the slides as images plus a talk.html page that shows each slide on the
  left and the transcript spoken while it was on screen on the right, and a talk.md
  with the same content for further processing. Downloads with yt-dlp, detects slide
  changes with ffmpeg (also in framed conference layouts with a speaker inset),
  transcribes with the MacWhisper CLI mw or another speech-to-text tool on the
  system, and deletes the video afterwards. Triggers: "digest this talk",
  "extract the slides from this video", "slides and transcript from this talk",
  "talk extractor", "turn this conference talk into a page". Also trigger when the
  user pastes a YouTube link to a talk or conference session and wants to read
  or process it instead of watching it.
---

# tube-tapas

```
<talk-slug>/
├── talk.html     slide left, transcript right, one row per slide
├── talk.md       the same content as Markdown
├── talk.json     slide times and transcript segments, input for rebuilds
└── assets/       slide-NNN.jpg
```

**Output language:** the transcript stays in the language of the talk. The page has no
prose of its own. Reports to the user follow the user's language.

## What this skill does NOT do

- It does not summarise, translate or comment on the talk.
- It does not keep the video. The page links every slide to its time in the source.
- It does not download playlists or videos behind a login.
- It does not find slides in a talk without slides: a pure speaker video yields a few camera frames.

## Requirements

`yt-dlp`, `ffmpeg` and `ffprobe` are required. `mw` (MacWhisper CLI, MacWhisper Pro) is
preferred and optional. If a required tool is missing, the script stops with a list: tell
the user what to install.

Output folder: `--out <dir>`, else `output_root: <dir>` from
`~/.config/tube-tapas/config.md`, else the current working directory.

## Step 1 — Run the pipeline

```bash
<skill-dir>/scripts/talk_digest.ts run "<url>"            # language: auto
<skill-dir>/scripts/talk_digest.ts run "<url>" --language de
```

If the user names the talk language, pass `--language`. If the talk is longer than 20
minutes, run the command in the background. The script prints the folder, the slide count
and the number of slides without transcript. If the script fails, it cleans up itself:
report the error line to the user.

## Step 1b — Transcribe without MacWhisper

Skip this step when `mw` is on PATH. Without `mw`, `run` builds the folder without a
transcript and leaves `audio.wav` (16 kHz mono) in it.

1. Look for a local speech-to-text CLI: `command -v whisper-cli whisper mlx_whisper`. Prefer
   a local tool over a cloud service.
2. Find the SRT option in the tool's `--help`. Pass the talk language when known. OpenAI
   Whisper: `--output_format srt --output_dir <dir>`. whisper.cpp: `-osrt -of <name>`, needs
   a model file.
3. If no tool exists, tell the user and stop. Never install a tool or download a model
   without asking.
4. Run `<skill-dir>/scripts/talk_digest.ts transcript <folder> <file.srt>`. The command
   attaches the segments, deletes `audio.wav` and rebuilds the page.

## Step 2 — Review the slides

Detection keeps every picture that holds still after a change, so some pictures are not
slides: sponsor cards, conference promos, stage or audience camera, the outro logo. Black
and single-colour frames are already gone.

1. Run `<skill-dir>/scripts/talk_digest.ts sheets <folder>`.
2. Read every contact sheet. Each sheet line names the slide range; the grid has six slides
   per row, left to right, top to bottom.
3. List the numbers of the pictures that are not part of the talk. Keep the talk's title
   card, demo screens and code. If unsure, keep the picture.
4. If the list is not empty, run
   `<skill-dir>/scripts/talk_digest.ts build <folder> --drop <n,n,...>`. A dropped slide
   gives its time and transcript to the next slide. Run `--drop` once per review: the
   numbers refer to the latest build.

## Step 3 — Report

Tell the user the absolute folder path, the slide count after the review, the dropped
pictures, and `open "<folder>/talk.html"`.

If the user asks about empty slides: a slide shows "—" when it was on screen only inside one
sentence segment, because a segment belongs to the slide on screen when the segment starts.

## Tuning

The detection constants sit at the top of `scripts/talk_digest.ts`. If the result is clearly
wrong, report the symptom to the user before you change a constant.

| Symptom | Constant |
|---|---|
| Slides with small changes (code, bullet builds) are missing | lower `STEP` |
| Speaker movement produces extra slides | raise `STEP` or lower `BUSY` |
| Quick slide sequences collapse into one | lower `MIN_GAP` |

Change the look of `talk.html` in [assets/template.html](assets/template.html), never in
the script. After every change to the script or the template, run
`scripts/talk_digest.ts --self-test`.
