> **This is a fork.** Upstream Hypersonic is by [reboot.studio](https://www.raycast.com/reboot/hypersonic)
> and lives in [`raycast/extensions`](https://github.com/raycast/extensions/tree/main/extensions/hypersonic).
> This fork adds sub-issue support and in-extension editing of a task's body.

<p align="center">
<img width=180 src="https://user-images.githubusercontent.com/42417619/203419063-8281b9d0-6fba-4c6c-b381-cdf59ee42e18.png">
</p>

<h1 align="center">Hypersonic</h1>

<h4 align="center">
Fastest Notion task manager
</h4>

## Introducing Hypersonic for Teams

**[Watch video presentation](https://www.loom.com/share/1f4c369a32794c779458bbfbcdf27494)**

![Hypersonic interface](/metadata/hypersonic-1.png)

### Connect any Notion database

Sign in with your Notion account and connect your project and task databases.

We automatically detect the right properties in your database to display on Hypersonic. You can also configure additional properties as labels, users or related databases.

![Notion connection](/metadata/hypersonic-5.png)

### Create and assign tasks using natural language

You can manage your tasks faster than ever in Hypersonic. We use natural language recognition to separate the task from its metadata, so you just need to type.

![Natural language](/metadata/hypersonic-2.png)

### Multi-filtering to cut through the noise

You can filter your task by user, project or label. Combining multiple filter you will increase your focus and productivity.

![Smart filtering](/metadata/hypersonic-3.png)

### Sub-issues

Notion's native sub-items are supported as a browsable tree. Pick the
self-referencing relation that points at a task's parent under **Sub-issues** in
the database settings, then navigate the tree the way you would in yazi:
`⌃ + L` descends into the selected task's sub-issues, `⌃ + H` climbs back out.
The current path is shown in the window title, and a chevron badge on each row
shows how many sub-issues it holds.

While sub-issues are configured the main list shows only top-level tasks, and a
task created inside a level is automatically filed under that parent. The menu
bar command is unaffected and keeps listing every active task, nested or not.

Both shortcuts can be rebound in Raycast under **Settings → Extensions →
Hypersonic**.

### List of commands

- Press `↵` to complete a task or create a new one.
- Press `⌃ + L` to drill into a task's sub-issues.
- Press `⌃ + H` to climb back out one level.
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
- Press `⌘ + ⌫` to delete a task.
- Press `⌘ + T` to share your work.
- Press `⌘ + N` to open Notion database.
- Press `⌘ + ⇧ + A` to authorize Hypersonic with Notion.
- Press `⌘ + ⇧ + ,` to open database settings.
- Press `⌘ + ,` to open extension preferences.
- Press `⌘ + ⇧ + M` to contact us.

---

<p align="right">
Made with ♥ by <a href="https://reboot.studio">Reboot Studio</a>
</p>
