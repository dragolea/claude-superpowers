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

  const hint = opts?.showBack
    ? "space to toggle · enter to confirm · esc to go back"
    : "space to toggle · enter to confirm";

  const result = await p.multiselect({
    message: `${title}  ${pc.dim(hint)}`,
    options: items,
    initialValues: preselected,
    required: false,
  });

  if (p.isCancel(result)) {
    return null;
  }

  return result as string[];
}
