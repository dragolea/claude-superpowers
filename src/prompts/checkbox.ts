import * as p from "@clack/prompts";

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
  const preselected = new Set(opts?.preselected ?? []);

  const items = options.map((o) => ({
    label: o.label,
    value: o.value,
    hint: o.description,
    initialValue: preselected.has(o.value),
  }));

  const result = await p.multiselect({
    message: title,
    options: items,
    required: false,
  });

  if (p.isCancel(result)) {
    return null;
  }

  return result as string[];
}
