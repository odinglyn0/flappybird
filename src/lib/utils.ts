// SPDX-License-Identifier: WTFPL
export function cn(...inputs: Array<string | undefined | false | null>) {
  return inputs.filter(Boolean).join(' ');
}
