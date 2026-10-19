# AcademiAI: implemented specification

## Audience and purpose

University students of any year who are beginners at using AI for studying and academic research. The site is designed for presentation and use on a laptop. Its three subject settings give concrete examples without requiring specialist knowledge.

## Course ownership

| Order | Module                               | Subject           | Owner            |
| ----- | ------------------------------------ | ----------------- | ---------------- |
| 1     | Prompting with purpose               | Mathematics       | Faris Al Hajeri  |
| 2     | Giving AI useful context             | Physics           | Sultan Alhammadi |
| 3     | Verifying and learning independently | Academic research | Rashed Al Hosani |

Sultan Alhammadi owns shared code, integration, visual design and assets. Content is separate from behaviour and styling. All modules use the same quiz engine and interaction components.

## Screens

- **Home:** course introduction, generated medal composition and the three-module learning path.
- **Learn:** descriptions, owners, availability and best scores.
- **Lesson:** module rail, two learning outcomes, three short sections, one worked example, source links and quiz entry.
- **Quiz:** one question at a time, progress, selection, submission, locked answers and correct-answer feedback.
- **Results:** last attempt's score, pass/fail, retake/review actions and best-score retention when relevant.
- **My Certificates:** three distinct collectible medals; pending medals enter their positions on the first collection visit after earning them. Completion is celebrated once all three are placed.
- **Resources & References:** further reading and seven numbered IEEE references.
- **About:** audience, project purpose, team information.

## Lesson and quiz contract

Each module has two outcomes, three lesson sections, one worked example and exactly five questions:

1. Four-option single choice.
2. Four-option single choice.
3. Two-option compare and choose.
4. Two-option compare and choose.
5. Three-pair matching.

Questions use prepared content. Students select a left-hand matching item, then a right-hand item. Changing a match releases the previous association. Each right-hand item can belong to only one pair.

Submission is unavailable until the answer is complete. Submitted choices lock. Feedback keeps the question visible, marks the result with colour and an icon, and displays the correct answer. It contains no explanatory paragraph. A correct answer triggers a small confetti burst; an incorrect answer receives a brief movement and red state. The next question is available after submission. There is no backward movement within an attempt.

Every question is worth one point. Matching earns its point only when all three pairs are correct. A score of four or five passes. Passing unlocks the next module. Retakes use the same questions and retain the best score. A lower score never revokes medals or unlocks.

## Session rules

Completed results, best scores, earned timestamps, medal-placement flags and the completion-celebration flag are stored in `sessionStorage`. An unfinished attempt is held in memory only. Refresh returns an unfinished quiz to its lesson. In-app navigation and browser hash navigation ask before discarding an unfinished attempt; cancellation preserves it.

Medals are awarded once and placed once. Their placement occurs when the collection is visited, including when several medals are pending. The final celebration waits until all three placements complete and runs once per tab session. Reduced-motion preferences suppress nonessential movement and confetti.

No name entry, accounts, persistent learner database, live AI chat, real MCP integration, question randomisation, timer, videos, certificate export or restart control. Standard browser tab restoration/duplication can retain or copy session storage.

## Visual implementation

The approved direction is a dark interactive academy. Monogram option 03 appears in the header and favicon. The brand is written **AcademiAI**. Shared Inter typography, cool blue/violet accents, thin borders and restrained gradients connect the pages. Blue, violet and gold brushed-metal medals identify the three modules.

Core colours: background `#101218`, surface `#181C24`, text `#EDF0F7`, secondary text around `#A5ADBD`, blue `#99C2FF`, violet `#B4A8FB`. Hover, focus, selected, correct, incorrect, disabled and locked states are shared across modules. Correctness is also communicated in text and icons.

The lesson uses a narrow module rail and a reading column. Single-choice questions use stacked answers; comparisons use two columns; matching uses two labelled columns. No general-purpose bespoke question-layout builder is included. Special figures or interactions remain individual scope decisions.

The original mockups and generated asset sources are in `design/`. Final styling is implemented in the shared stylesheet and components, not copied into module data.

## Technical implementation

React + TypeScript + Vite; shared CSS; Motion for component transitions and medal placement; canvas-confetti; KaTeX for mathematical expressions. Fonts and medal images are local assets. The production build is static, uses relative paths and hash navigation, and works below a GitHub Pages repository path.

`src/logic.ts` checks answers and manages progress without UI dependencies. `src/data/` supplies content and numbered sources. `src/ui.tsx` contains shared controls and assets. `src/App.tsx` manages pages and the shared controller. The development-only `#/preview` route supplies isolated question and medal previews without writing learner state.

## Content provenance

Shi et al. concerns arithmetic problems with irrelevant context in the tested models; it does not establish physics learning outcomes. MCP documentation describes a communication standard, not a guarantee of correct answers. Original teaching examples apply these ideas to the module subjects. The research document and authentic team collaboration record remain separate deliverables.
