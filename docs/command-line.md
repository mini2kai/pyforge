# Command-line launcher

Install the `pyforge` command from **PyForge → Install 'pyforge' Command** on
macOS, or **Tools → Install 'pyforge' Command** on Windows and Linux. The same
action is available in Find Action. Open a new terminal after installation.

- **macOS:** move PyForge to Applications first. The command links to the launcher
  inside the app bundle. It uses `~/.local/bin` when that directory is on PATH;
  otherwise it uses `/usr/local/bin` and may request an administrator password.
- **Windows:** installation creates `pyforge.cmd` in
  `%LOCALAPPDATA%\PyForge\bin` and adds that directory to the user PATH. This
  works with installed and portable copies, without administrator rights.
- **Linux:** installation creates `~/.local/bin/pyforge`. If another command
  takes precedence or this directory is absent from PATH, the notification asks
  you to put it at the beginning of your shell's PATH. For Bash and Zsh, add
  `export PATH="$HOME/.local/bin:$PATH"` to your shell profile. For Fish, run
  `fish_add_path --prepend ~/.local/bin`. An AppImage launcher targets the original
  AppImage; keep that file in a permanent location.

```sh
pyforge .
pyforge src/main.rs README.md
pyforge --line 12 --column 5 src/main.rs
pyforge src/main.rs:12:5
pyforge diff before.txt after.txt
pyforge --help
pyforge --version
```

Folders open as projects. Files open in their project's window, or in LightEdit
when no project contains them. Lines and columns start at 1. With no paths, the
command focuses PyForge. It starts the app if necessary and returns after handing
off the request. Unknown options and missing files exit with code 1.

Use `--` before a filename beginning with `-`, or before a file named `diff`.
The existing GUI executable and OS file associations still work.

**Uninstall 'pyforge' Command** removes only PyForge's launcher, and on Windows
its dedicated user PATH entry. A command belonging to another application is
never overwritten or removed. Reinstall the command after moving a portable
copy or AppImage to a different location.
