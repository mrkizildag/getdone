> **GetDone is a fork of [Hypersonic](https://www.raycast.com/reboot/hypersonic)** by
> reboot.studio, which lives in
> [`raycast/extensions`](https://github.com/raycast/extensions/tree/main/extensions/hypersonic).
> It adds sub-issue navigation, and fixes several bugs in the original.

<p align="center">
<img width=180 src="assets/icon.png">
</p>

<h1 align="center">GetDone</h1>

<h4 align="center">
Fast Notion task manager, with sub-issues
</h4>

## Introducing GetDone for Teams

**[Watch video presentation](https://www.loom.com/share/1f4c369a32794c779458bbfbcdf27494)**

![GetDone interface](/metadata/hypersonic-1.png)

### Connect any Notion database

Sign in with your Notion account and connect your project and task databases.

We automatically detect the right properties in your database to display on GetDone. You can also configure additional properties as labels, users or related databases.

![Notion connection](/metadata/hypersonic-5.png)

### Create and assign tasks using natural language

You can manage your tasks faster than ever in GetDone. We use natural language recognition to separate the task from its metadata, so you just need to type.

![Natural language](/metadata/hypersonic-2.png)

### Multi-filtering to cut through the noise

You can filter your task by user, project or label. Combining multiple filter you will increase your focus and productivity.

![Smart filtering](/metadata/hypersonic-3.png)

### Sub-issues

Notion's native sub-items are supported as a browsable tree. Pick the
self-referencing relation that points at a task's parent under **Sub-issues** in
the database settings, then navigate the tree the way you would in yazi:
`⇥` descends into the selected task's sub-issues, `⇧ + ⇥` climbs back out.
The current path is shown in the window title, and a chevron badge on each row
shows how many sub-issues it holds.

Two views, toggled with `⌘ + ⇧ + O`:

- **Top-level only** (default) — the main list shows tasks that aren't nested
  inside another task. Leaf tasks and parent tasks sit side by side; only the
  children are tucked away one level down.
- **All issues** — the main list shows every task regardless of depth. Drilling
  in still works, so you can jump from a sub-issue's siblings straight into its
  own children.

Your choice of view is remembered between launches. Switching view returns you
to the top, since a path through the tree has no meaning in the flat view — but
the path itself is never restored: reopening the command always starts at the
top of whichever view you last used. A task created inside a level is automatically filed
under that parent. The menu bar command is unaffected and always lists every
active task, nested or not.

All three shortcuts can be rebound in Raycast under **Settings → Extensions →
GetDone**.

### List of commands

- Press `↵` to complete a task or create a new one.
- Press `⇥` to drill into a task's sub-issues.
- Press `⇧ + ⇥` to climb back out one level.
- Press `⌘ + ⇧ + O` to toggle between top-level-only and all issues.
- Press `⌘ + ↵` to set a status.
- Press `⌘ + F` to filter your tasks.
- Press `⌘ + R` to edit the title of a task.
- Press `⌘ + D` to add a due date.
- Press `⌘ + L` to add a label.
- Press `⌘ + U` to add a user.
- Press `⌘ + P` to add a project.
- Press `⌘ + E` to open a external link.
- Press `⌘ + ⇧ + C` to copy a task to the clipboard.
- Press `⌘ + ⇧ + S` to share a task.
- Press `⌘ + O` to open the task in Notion.
- Press `⌃ + X` to delete a task.
- Press `⌘ + T` to share your work.
- Press `⌘ + N` to open Notion database.
- Press `⌘ + ⇧ + A` to authorize GetDone with Notion.
- Press `⌘ + ⇧ + ,` to open database settings.
- Press `⌘ + ⇧ + P` to open extension preferences.
- Press `⌘ + ⇧ + M` to contact us.

---

<p align="right">
Made with ♥ by <a href="https://reboot.studio">Reboot Studio</a>
</p>
