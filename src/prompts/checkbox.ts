import * as p from "@clack/prompts";
import pc from "picocolors";

export interface CheckboxOption {
  label: string;
  description?: string;
  value: string;
}

/**
 * Multi-select checkbox menu.
 * Returns selected values, or null if user cancelled/chose back.
 */
export async function checkboxMenu(
  title: string,
  options: CheckboxOption[],
  opts?: {
    preselected?: string[];
    showBack?: boolean;
  },
): Promise<string[] | null> {
  const preselected = opts?.preselected ?? [];

  const maxLabelLen = Math.max(...options.map((o) => o.label.length));
  const items: Array<{ label: string; value: string }> = options.map((o) => ({
    label: o.description
      ? `${o.label.padEnd(maxLabelLen + 2)}${pc.dim(`— ${o.description}`)}`
      : o.label,
    value: o.value,
  }));

  if (opts?.showBack) {
    items.push({ label: pc.dim("← Back"), value: "__back__" });
  }

  const result = await p.multiselect({
    message: title,
    options: items,
    initialValues: preselected,
    required: false,
  });

  if (p.isCancel(result)) {
    return null;
  }

  const selected = result as string[];
  if (selected.includes("__back__")) {
    return null;
  }

  return selected;
}
