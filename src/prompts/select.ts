import * as p from "@clack/prompts";
import pc from "picocolors";

export interface SelectOption {
  label: string;
  description?: string;
  value: string;
}

/**
 * Single-select menu. Returns the selected value, or null if user cancelled/chose back.
 */
export async function selectMenu(
  title: string,
  options: SelectOption[],
  opts?: { showBack?: boolean },
): Promise<string | null> {
  const items: Array<{ label: string; value: string; hint?: string }> = options.map((o) => ({
    label: o.label,
    value: o.value,
    hint: o.description,
  }));

  if (opts?.showBack) {
    items.push({
      label: pc.dim("← Back"),
      value: "__back__",
    });
  }

  const result = await p.select({
    message: title,
    options: items,
  });

  if (p.isCancel(result) || result === "__back__") {
    return null;
  }

  return result as string;
}
