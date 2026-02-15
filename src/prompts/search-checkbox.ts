import pc from "picocolors";

export interface SearchItem {
  name: string;
  description: string;
}

/**
 * Custom searchable multi-select.
 * Users type to filter, space to toggle, enter to confirm, esc to cancel.
 * Returns selected names, or null if cancelled.
 */
export async function searchCheckboxMenu(
  title: string,
  items: SearchItem[],
  initialFilter = "",
): Promise<string[] | null> {
  const selected = new Set<string>();
  let filter = initialFilter;
  let cursorIdx = 0;
  let scrollOffset = 0;

  const getTermHeight = (): number => {
    return process.stdout.rows || 24;
  };

  const getVisible = (): number[] => {
    const lc = filter.toLowerCase();
    const indices: number[] = [];
    for (let i = 0; i < items.length; i++) {
      if (
        !filter ||
        items[i].name.toLowerCase().includes(lc) ||
        items[i].description.toLowerCase().includes(lc)
      ) {
        indices.push(i);
      }
    }
    return indices;
  };

  return new Promise<string[] | null>((resolve) => {
    // Put stdin into raw mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    // Hide cursor
    process.stdout.write("\x1B[?25l");

    let lastLines = 0;

    const render = (): void => {
      const maxVisible = getTermHeight() - 7;
      const visible = getVisible();
      const visCount = visible.length;
      const displayCount = Math.min(visCount, Math.max(maxVisible, 5));

      // Clamp cursor
      if (cursorIdx >= visCount) cursorIdx = Math.max(0, visCount - 1);
      if (cursorIdx < 0) cursorIdx = 0;

      // Adjust scroll
      if (visCount > displayCount) {
        if (cursorIdx < scrollOffset) scrollOffset = cursorIdx;
        if (cursorIdx >= scrollOffset + displayCount)
          scrollOffset = cursorIdx - displayCount + 1;
      } else {
        scrollOffset = 0;
      }

      const lines: string[] = [];

      // Header
      lines.push(`${pc.bold(pc.cyan(`  ${title}`))}`);
      lines.push(
        pc.dim(
          "  Type to filter, space to toggle, enter to confirm, esc to cancel",
        ),
      );
      lines.push("");

      // Filter line
      lines.push(`  ${pc.bold("Filter:")} ${filter}${pc.inverse(" ")}`);
      lines.push("");

      // Item list
      if (visCount === 0) {
        lines.push(`  ${pc.dim(`No items match "${filter}"`)}`);
        lines.push("");
      } else {
        const maxNameLen = Math.max(...visible.map((i) => items[i].name.length));
        const end = Math.min(scrollOffset + displayCount, visCount);
        for (let vi = scrollOffset; vi < end; vi++) {
          const idx = visible[vi];
          const item = items[idx];
          const isSelected = selected.has(item.name);
          const checkbox = isSelected ? pc.green("[x]") : "[ ]";

          let desc = item.description;
          if (desc.length > 50) desc = desc.slice(0, 50) + "...";

          const paddedName = item.name.padEnd(maxNameLen + 2);

          if (vi === cursorIdx) {
            lines.push(
              `  ${pc.bold(">")} ${checkbox} ${pc.bold(paddedName)}${pc.dim(`— ${desc}`)}`,
            );
          } else {
            lines.push(`    ${checkbox} ${paddedName}${pc.dim(`— ${desc}`)}`);
          }
        }
      }

      // Footer
      lines.push("");
      lines.push(
        `  ${pc.dim(`${visCount} matching · ${selected.size} selected`)}`,
      );

      // Clear previous output and write new
      let output = "";
      if (lastLines > 0) {
        output += `\x1B[${lastLines}A`; // cursor up
        for (let i = 0; i < lastLines; i++) {
          output += "\x1B[2K"; // erase line
          if (i < lastLines - 1) output += "\x1B[1B"; // cursor down
        }
        output += `\x1B[${lastLines - 1}A`; // back to top
      }
      output += lines.map((l) => `\x1B[2K${l}`).join("\n") + "\n";
      lastLines = lines.length;

      process.stdout.write(output);
    };

    const cleanup = (): void => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      // Show cursor
      process.stdout.write("\x1B[?25h");
      process.stdin.removeAllListeners("data");
      process.stdin.pause();
    };

    render();

    process.stdin.on("data", (data: Buffer) => {
      const key = data.toString();
      const visible = getVisible();

      if (key === "\x1b" || key === "\x1b\x1b") {
        // Bare ESC — cancel
        cleanup();
        resolve(null);
        return;
      }

      if (key === "\x1b[A") {
        // Up arrow
        if (cursorIdx > 0) cursorIdx--;
        render();
        return;
      }

      if (key === "\x1b[B") {
        // Down arrow
        if (cursorIdx < visible.length - 1) cursorIdx++;
        render();
        return;
      }

      if (key === " ") {
        // Space — toggle
        if (visible.length > 0 && cursorIdx < visible.length) {
          const idx = visible[cursorIdx];
          const name = items[idx].name;
          if (selected.has(name)) {
            selected.delete(name);
          } else {
            selected.add(name);
          }
        }
        render();
        return;
      }

      if (key === "\r" || key === "\n") {
        // Enter — confirm
        cleanup();
        resolve([...selected]);
        return;
      }

      if (key === "\x7f" || key === "\x08") {
        // Backspace
        if (filter.length > 0) {
          filter = filter.slice(0, -1);
          cursorIdx = 0;
          scrollOffset = 0;
        }
        render();
        return;
      }

      // Regular printable character
      if (key.length === 1 && key >= " " && key <= "~") {
        filter += key;
        cursorIdx = 0;
        scrollOffset = 0;
        render();
        return;
      }
    });
  });
}
